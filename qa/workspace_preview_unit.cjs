// Pure fixture checks using the existing compiler; no DB or outbound requests.
const fs = require('fs'), ts = require('typescript'), assert = require('node:assert/strict');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const { orders, members, filterOrders, settledAmount, stateLabels } = require('../src/components/workspace/preview/fixtures.ts');
const checks = [];
function check(name, test) { test(); checks.push(name); console.log('PASS', name); }
check('Exactly five canonical order states; valid IRR snapshots', () => {
  assert.equal(Object.keys(stateLabels).length, 5);
  for (const order of orders) { assert(Object.hasOwn(stateLabels, order.state)); assert.equal(order.currency, 'IRR'); assert(order.amount > 0 && Number.isInteger(order.amount)); }
});
check('Settled total excludes pending, declined and cancelled orders', () => { assert.equal(settledAmount(orders), 3300000); assert.equal(settledAmount([]), 0); });
check('Status, search and date filters compose without changing source', () => {
  assert.equal(filterOrders('awaiting_confirmation', '', 30).length, 2);
  assert.equal(filterOrders('all', '', 7).length, 5);
  assert.equal(filterOrders('all', 'S-1045', 30).length, 1);
  assert.equal(filterOrders('awaiting_confirmation', 'S-1045', 30).length, 0);
  assert.equal(filterOrders('all', 'nonexistent', 30).length, 0);
  assert.equal(orders.length, 7);
});
check('Referral tree has one root, valid public codes, no cycles or financial fields', () => {
  assert.equal(members.filter(member => member.parent === null).length, 1);
  assert.equal(new Set(members.map(member => member.code)).size, members.length);
  for (const member of members) {
    assert.match(member.code, /^\d{8}$/); assert.deepEqual(Object.keys(member).sort(), ['code', 'level', 'name', 'parent']);
    const seen = new Set(); let current = member;
    while (current.parent) { assert(!seen.has(current.code)); seen.add(current.code); current = members.find(parent => parent.code === current.parent); assert(current); }
  }
});
fs.writeFileSync('qa/workspace-preview-unit-results.json', JSON.stringify({ passed: true, checks, data: 'sample fixtures only' }, null, 2));
