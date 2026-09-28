import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/app/sample-data.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022}});
const {seedForms} = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
test('sample totals, answer labels, and conditional references match their forms', () => {
 const forms = seedForms(new Date('2026-09-27T12:00:00Z'));
 assert.equal(forms.length, 12);
 const ids = new Set();
 for (const form of forms) {
  assert.equal(form.responses, form.entries.length);
  if (form.status === 'Draft') assert.equal(form.responses, 0);
  const fields = new Map(form.fields.map(f => [f.id, f]));
  form.fields.forEach((field, index) => {
   for (const rule of [field.visibleWhen, field.requiredWhen].filter(Boolean)) {
    assert.ok(form.fields.slice(0, index).some(f => f.id === rule.fieldId));
   }
  });
  for (const entry of form.entries) {
   assert.ok(!ids.has(entry.id)); ids.add(entry.id);
   assert.ok(Number.isFinite(Date.parse(entry.date)));
   for (const [id, value] of Object.entries(entry.answers)) {
    assert.ok(fields.has(id));
    assert.equal(entry.labels[id], fields.get(id).label);
    if (fields.get(id).options.length) assert.ok(fields.get(id).options.includes(value));
   }
  }
 }
 assert.ok(forms.some(f => f.fields.some(field => field.type === 'Page break')));
 assert.ok(forms.some(f => f.visibility === 'private' && f.shared));
 assert.ok(forms.filter(f => !f.shared).some(f => f.entries.length));
});
test('reset samples have independent objects and dates relative to initialization', () => {
 const now = new Date('2026-09-27T12:00:00Z');
 const first = seedForms(now), second = seedForms(now);
 first[0].fields[0].options.push('Mutation');
 assert.ok(!second[0].fields[0].options.includes('Mutation'));
 assert.equal(second[0].entries[0].date, '2026-09-27T11:00:00.000Z');
});

test('some samples have bundled fitted banners and others remain image-free', () => {
 const forms = seedForms();
 const banners = forms.filter(form => form.bannerImage);
 assert.equal(banners.length, 4);
 assert.equal(new Set(banners.map(form => form.bannerImage)).size, 4);
 for (const form of banners) {
  assert.equal(form.bannerFit, true);
  assert.equal(form.bannerImage, '/' + form.bannerFilename);
 }
 assert.ok(forms.some(form => !form.bannerImage));
});
