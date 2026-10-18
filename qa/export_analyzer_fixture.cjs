// Uses the existing TypeScript dependency only; exports a reproducible QA fixture.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  if(request.startsWith('@/')) request = path.join(process.cwd(),'src',request.slice(2));
  return resolve.call(this, request, parent, ...args);
};
require.extensions['.ts'] = function(module, filename) {
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020}}).outputText;
  module._compile(code, filename);
};
const {allItems,casioSsPack} = require('../src/lib/analyzers/casio-ss/instrument.ts');
const {scorePack} = require('../src/lib/analyzers/score.ts');
const answers = Object.fromEntries(allItems.map((item) => [item.id, item.kind==='range' ? 6 : item.kind==='text' ? 'کسب‌وکار آزمایشی' : item.options[0].value]));
fs.writeFileSync('qa/analyzer-fixture.json',JSON.stringify({answers,results:scorePack(casioSsPack,answers)},null,2));
console.log('Analyzer fixture:',allItems.length,'answers');
