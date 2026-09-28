import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/app/form-version.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
const {snapshot,migrateForm,hasDraft,publishForm,discardDraft,canReadForm,moveField,formPages,fieldStates,duplicateForm}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const field=(id,type='Text input')=>({id,type,label:id,description:'',required:false,options:[]});
const make=()=>({id:'test',name:'Original',description:'Live description',status:'Published',responses:5,modified:'2026-09-26',shared:false,fields:[field('one'),field('two')],entries:[]});
test('legacy published forms migrate without losing responses or creating a draft',()=>{const f=migrateForm(make());assert.equal(f.responses,5);assert.equal(f.published.name,'Original');assert.equal(hasDraft(f),false);});
test('draft title and nested options never mutate the published snapshot',()=>{const f=migrateForm(make());f.name='Draft';f.fields[0].options.push('New option');assert.equal(f.published.name,'Original');assert.deepEqual(f.published.fields[0].options,[]);assert.equal(hasDraft(f),true);});
test('publish replaces the live version and clears unpublished changes',()=>{const f=migrateForm(make());f.name='Revision';const live=publishForm(f);assert.equal(live.published.name,'Revision');assert.equal(hasDraft(live),false);assert.equal(live.responses,5);f.fields[0].label='Later change';assert.equal(live.published.fields[0].label,'one');});
test('discard restores the published version and preserves responses',()=>{const f=migrateForm(make());f.name='Discard me';f.fields=[];const restored=discardDraft(f);assert.equal(restored.name,'Original');assert.equal(restored.fields.length,2);assert.equal(restored.responses,5);assert.equal(hasDraft(restored),false);});
test('an unpublished form has no public version and discarding removes it',()=>{const f=migrateForm({...make(),status:'Draft'});assert.equal(f.published,null);assert.equal(canReadForm(f,'derek'),false);assert.equal(discardDraft(f),null);});
test('private published access requires a permitted account',()=>{const f=publishForm({...make(),visibility:'private',allowedUsers:['derek']});assert.equal(canReadForm(f,'derek'),true);assert.equal(canReadForm(f,null),false);assert.equal(canReadForm(f,'guest'),false);assert.equal(canReadForm(f,'alex'),false);f.allowedUsers.push('alex');assert.equal(canReadForm(f,'alex'),false);assert.equal(canReadForm(publishForm(f),'alex'),true);});
test('access changes remain drafts until published',()=>{let f=migrateForm(make());f.visibility='private';assert.equal(canReadForm(f,'guest'),true);f=publishForm(f);assert.equal(canReadForm(f,'guest'),false);assert.equal(canReadForm(f,'derek'),true);});
test('page breaks create pages, including an explicit trailing page',()=>{const fields=[field('a'),field('break','Page break'),field('b'),field('end','Page break')];assert.deepEqual(formPages(fields).map(page=>page.map(f=>f.id)),[['a'],['b'],[]]);});
test('keyboard and drag reorder use the same immutable movement semantics',()=>{const fields=[field('a'),field('b'),field('c')];assert.deepEqual(moveField(fields,0,2).map(f=>f.id),['b','c','a']);assert.deepEqual(fields.map(f=>f.id),['a','b','c']);assert.deepEqual(moveField(fields,2,0).map(f=>f.id),['c','a','b']);assert.equal(moveField(fields,0,-1),fields);assert.equal(moveField(fields,2,3),fields);});


test('conditional visibility and requirements follow earlier answers, including checkbox choices',()=>{
 const fields=[field('source'),{...field('target'),visibleWhen:{fieldId:'source',operator:'equals',value:'YES'},requiredWhen:{fieldId:'source',operator:'answered',value:''}}];
 assert.deepEqual(fieldStates(fields,{}).target,{visible:false,required:false});
 assert.deepEqual(fieldStates(fields,{source:['no','yes']}).target,{visible:true,required:true});
 assert.deepEqual(fieldStates(fields,{source:['no']}).target,{visible:false,required:false});
});
test('hidden source answers cannot activate later rules, and missing sources do not hide questions',()=>{
 const fields=[field('a'),{...field('b'),visibleWhen:{fieldId:'a',operator:'equals',value:'yes'}},{...field('c'),visibleWhen:{fieldId:'b',operator:'answered',value:''}}];
 assert.equal(fieldStates(fields,{a:['no'],b:['stale']}).c.visible,false);
 assert.equal(fieldStates(fields.slice(1),{}).b.visible,true);
 assert.equal(fieldStates([fields[1],fields[0]],{}).b.visible,true);
});
test('not-equal requires a nonempty answer and defaults can activate a rule',()=>{
 const fields=[{...field('a'),defaultValue:'yes'},{...field('b'),requiredWhen:{fieldId:'a',operator:'notEquals',value:'no'}}];
 assert.equal(fieldStates(fields,{}).b.required,true);
 assert.equal(fieldStates(fields,{a:['']}).b.required,false);
});
test('duplicates are independent drafts with fresh field IDs, remapped rules, and sequential names',()=>{
 const source=publishForm(make()); source.fields[1].visibleWhen={fieldId:'one',operator:'equals',value:'yes'};
 let index=0; const id=()=>`copy-id-${++index}`;
 const copy=duplicateForm(source,[source],id);
 assert.equal(copy.name,'Original copy'); assert.equal(copy.published,null); assert.equal(copy.responses,0); assert.deepEqual(copy.entries,[]);
 assert.equal(copy.fields[1].visibleWhen.fieldId,copy.fields[0].id);
 copy.fields[0].label='Changed'; assert.equal(source.fields[0].label,'one');
 const second=duplicateForm(source,[source,copy],id); assert.equal(second.name,'Original copy 2');
 assert.equal(duplicateForm(copy,[source,copy,second],id).name,'Original copy 3');
});
test('rules are included in published snapshots and restored when discarding a draft',()=>{
 const source=publishForm(make()); source.fields[1].requiredWhen={fieldId:'one',operator:'answered',value:''};
 assert.equal(hasDraft(source),true); assert.equal(discardDraft(source).fields[1].requiredWhen,undefined);
 const live=publishForm(source); source.fields[1].requiredWhen.value='changed'; assert.equal(live.published.fields[1].requiredWhen.value,'');
});


test('banner changes stay in drafts and discard restores absence or the published image',()=>{
 const form=publishForm(make()); form.bannerImage='data:image/png;base64,AAAA';
 assert.equal(form.published.bannerImage,undefined); assert.equal(hasDraft(form),true);
 assert.equal(discardDraft(form).bannerImage,undefined);
 const published=publishForm(form); published.bannerImage=undefined;
 assert.equal(discardDraft(published).bannerImage,'data:image/png;base64,AAAA');
 assert.equal(publishForm(published).published.bannerImage,undefined);
});

test('presentation settings publish together and discard restores older absent values', () => {
 const form = publishForm(make());
 Object.assign(form, {bannerFilename: 'banner.webp', bannerFit: true, requiredMessage: 'Please answer starred questions.', requiredMessageLocation: 'Bottom'});
 assert.equal(hasDraft(form), true);
 assert.equal(form.published.requiredMessage, undefined);
 const discarded = discardDraft(form);
 for (const key of ['bannerFilename', 'bannerFit', 'requiredMessage', 'requiredMessageLocation']) assert.equal(discarded[key], undefined);
 const live = publishForm(form);
 assert.equal(live.published.requiredMessageLocation, 'Bottom');
 assert.equal(live.published.bannerFit, true);
 live.requiredMessage = ''; live.requiredMessageLocation = 'Hidden';
 assert.equal(discardDraft(live).requiredMessage, 'Please answer starred questions.');
 const next = publishForm(live);
 assert.equal(next.published.requiredMessage, '');
 assert.equal(next.published.requiredMessageLocation, 'Hidden');
});

test('required message alignment stays in drafts until published and restores on discard', () => {
 const form = publishForm(make());
 form.requiredMessageAlignment = 'Center';
 assert.equal(form.published.requiredMessageAlignment, undefined);
 assert.equal(discardDraft(form).requiredMessageAlignment, undefined);
 const live = publishForm(form);
 assert.equal(live.published.requiredMessageAlignment, 'Center');
 live.requiredMessageAlignment = 'Right';
 assert.equal(discardDraft(live).requiredMessageAlignment, 'Center');
 assert.equal(publishForm(live).published.requiredMessageAlignment, 'Right');
});
