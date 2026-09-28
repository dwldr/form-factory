import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const compile = source => ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022}}).outputText;
const load = source => import('data:text/javascript;base64,' + Buffer.from(compile(source)).toString('base64'));
const versions = await load(await readFile(new URL('../src/app/form-version.ts', import.meta.url), 'utf8'));
const source = await readFile(new URL('../src/app/store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('store.ts', source, ts.ScriptTarget.Latest, true);
const store = ast.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'Store');
const discard = store.members.find(node => node.name?.getText(ast) === 'discard').getText(ast);
const {create} = await load(`export function create(snapshot, discardDraft) { return class { ${discard} }; }`);
const Harness = create(versions.snapshot, versions.discardDraft);
function harness(records) {
 const instance = new Harness();
 let forms = records;
 instance.forms = () => forms;
 instance.forms.update = update => {forms = update(forms)};
 instance.canEdit = () => true;
 return instance;
}
const form = () => ({id:'draft', name:'Draft title', description:'Draft description', fields:[], entries:[], responses:0, status:'Draft', modified:'2026-09-28', shared:false, published:null});
test('undo restores a never-published draft at its original position exactly once', () => {
 const draft = form(), other = {...form(), id:'other'};
 const store = harness([draft, other]);
 const undo = store.discard('draft');
 assert.deepEqual(store.forms().map(f=>f.id), ['other']);
 assert.equal(undo(), true);
 assert.deepEqual(store.forms(), [draft, other]);
 assert.equal(undo(), false);
});
test('undo restores unpublished changes while preserving responses received since deletion', () => {
 const draft = versions.publishForm(form()); draft.name = 'Unpublished title';
 const store = harness([draft]); const undo = store.discard('draft');
 assert.equal(store.forms()[0].name, 'Draft title');
 store.forms.update(forms => forms.map(f=>({...f, responses:1, entries:[{id:'new-response',date:'2026-09-28',answers:{}}]})));
 assert.equal(undo(), true);
 assert.equal(store.forms()[0].name, 'Unpublished title');
 assert.equal(store.forms()[0].published.name, 'Draft title');
 assert.equal(store.forms()[0].responses, 1);
 assert.equal(store.forms()[0].entries[0].id, 'new-response');
});
test('undo refuses to overwrite edits made after draft deletion', () => {
 const draft = versions.publishForm(form()); draft.description = 'Unpublished';
 const store = harness([draft]); const undo = store.discard('draft');
 store.forms.update(forms=>forms.map(f=>({...f,name:'Later edit'})));
 assert.equal(undo(), false);
 assert.equal(store.forms()[0].name, 'Later edit');
});
