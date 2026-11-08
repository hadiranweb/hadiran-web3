// QA-only Node ESM loader. Uses the candidate's existing TypeScript dependency.
// It does not change production sources or install a package.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
function findFile(base) {
  for (const p of [base, ...['.ts','.tsx','.mts','.js','.mjs','.json'].map(e => base+e), ...['index.ts','index.tsx','index.js'].map(e => path.join(base,e))]) {
    try { if (fs.statSync(p).isFile()) return pathToFileURL(p).href; } catch {}
  }
}
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const url = findFile(path.join(root,'src',specifier.slice(2)));
    if (url) return {url,shortCircuit:true};
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const url = findFile(path.resolve(path.dirname(fileURLToPath(context.parentURL)),specifier));
    if (url) return {url,shortCircuit:true};
  }
  try { return await nextResolve(specifier,context); }
  catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND' && e.code !== 'ERR_UNSUPPORTED_DIR_IMPORT') throw e;
    const parent = context.parentURL?.startsWith('file:') ? context.parentURL : pathToFileURL(path.join(root,'package.json')).href;
    try { return {url:pathToFileURL(createRequire(parent).resolve(specifier)).href,shortCircuit:true}; }
    catch { throw e; }
  }
}
export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && /\.(ts|tsx|mts)$/.test(fileURLToPath(url))) {
    const file = fileURLToPath(url);
    const { outputText } = ts.transpileModule(fs.readFileSync(file,'utf8'), {
      fileName:file,
      compilerOptions: { target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true, sourceMap:false },
    });
    return {format:'module',source:outputText,shortCircuit:true};
  }
  return nextLoad(url,context);
}
