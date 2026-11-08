// Synthetic print boundary cases; no DB import or application startup.
// node --loader ./qa/typescript-loader.mjs qa/build-document-print-fixtures.mjs output.json
import { writeFileSync } from 'node:fs';
import { defaultChrome } from '../src/lib/analyzers/document-template-defaults.ts';
import { renderChromeDocument, sampleInterpretationDocument } from '../src/lib/analyzers/document-chrome.ts';
if (!process.argv[2]) throw new Error('Provide an output JSON path');
const fixtures = [];
for (const id of ['casio-ss', 'casio-research']) {
  for (const count of [1, 3, 5, 7, 12]) {
    for (const patterns of [false, true]) {
      const doc = sampleInterpretationDocument(id);
      doc.layers = Array.from({ length: count }, (_, i) => ({
        ...doc.layers[i % doc.layers.length], id: `layer-${i}`, isBottleneck: i === 0,
      }));
      if (!patterns) doc.patterns = [];
      fixtures.push({ id, count, patterns, ...renderChromeDocument(defaultChrome(id), doc) });
    }
  }
}
writeFileSync(process.argv[2], JSON.stringify(fixtures));
