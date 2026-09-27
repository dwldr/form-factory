import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/app/notification-state.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
const {addNotification,openNotifications}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
test('every toast creates a record, including repeated messages; dismissal does not',()=>{
  let records=addNotification([],'1','Copied','2026-09-27');
  records=addNotification(records,'2','Copied','2026-09-27');
  assert.deepEqual(records.map(r=>r.id),['2','1']);
  assert.equal(addNotification(records,'3','','2026-09-27'),records);
  assert.equal(records.every(r=>!r.seen && r.highlighted),true);
});
test('first opening clears unread but preserves highlights; second opening clears highlights',()=>{
  const initial=addNotification([],'1','Saved','2026-09-27');
  const first=openNotifications(initial);
  assert.equal(first[0].seen,true); assert.equal(first[0].highlighted,true);
  const second=openNotifications(first);
  assert.equal(second[0].highlighted,false); assert.equal(initial[0].seen,false);
});
test('messages received while open stay unread and get their own first-view highlight',()=>{
  const first=openNotifications(addNotification([],'1','Old','2026-09-27'));
  const next=addNotification(first,'2','New','2026-09-27');
  assert.equal(next[0].seen,false);
  const reopened=openNotifications(next);
  assert.deepEqual(reopened.map(r=>r.highlighted),[true,false]);
  assert.equal(reopened.every(r=>r.seen),true);
});
