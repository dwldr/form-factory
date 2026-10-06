import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/app/form-presentation.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
const {BUTTON_COLORS,buttonColors,DEFAULT_THANK_YOU_MESSAGE}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const luminance=hex=>hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0);
test('every form button palette has at least 4.5:1 text contrast normally and on hover',()=>{
 for(const color of BUTTON_COLORS) for(const bg of [color.background,color.hover]) {
  const a=luminance(bg), b=luminance(color.text);
  assert.ok((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=4.5,color.id);
 }
});
test('existing forms keep the current success message and yellow default',()=>{
 assert.equal(buttonColors().id,'yellow');
 assert.equal(buttonColors('unknown').id,'yellow');
 assert.equal(DEFAULT_THANK_YOU_MESSAGE,'Your response has been recorded in this demo.\nYou may now close this browser tab or window.');
});
