import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import '@angular/compiler';
import { Location, HashLocationStrategy, PathLocationStrategy } from '@angular/common';

const source = await readFile(new URL('../src/app/public-url.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const { publicUrl } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

for (const [name, Strategy, base, prefix] of [
  ['development', PathLocationStrategy, '/', '/'],
  ['subfolder with server routing', PathLocationStrategy, '/form-factory/', '/form-factory/'],
  ['static PWP', HashLocationStrategy, '/form-factory/', '/form-factory/#/'],
]) {
  test(`${name}: copied public and private links respect routing and base`, () => {
    const platform = {
      getBaseHrefFromDOM: () => base,
      onPopState: () => () => {},
      onHashChange: () => () => {},
    };
    const location = new Location(new Strategy(platform));
    for (const path of ['f/demo', 'private/demo', 'forms/demo/preview']) {
      const url = publicUrl('/' + path, location, 'https://example.test' + base);
      assert.equal(url, 'https://example.test' + prefix + path);
      if (Strategy === HashLocationStrategy) {
        // Only the app directory is requested from a static server on refresh.
        assert.equal(new URL(url).pathname, base);
      }
    }
    assert.equal(publicUrl(null, location, 'https://example.test' + base), null);
    location.ngOnDestroy();
  });
}
