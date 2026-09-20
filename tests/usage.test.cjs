const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const output = mkdtempSync(join(tmpdir(), 'dashboard-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/usage.ts', '--outDir', output, '--module', 'commonjs', '--target', 'ES2020', '--skipLibCheck']);
const { normalizeReport, parseReport, periodKey, addDays } = require(join(output, 'lib/usage.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const model = { modelName: 'claude-opus-5', inputTokens: 10, outputTokens: 20, cacheCreationTokens: 30, cacheReadTokens: 40, cost: 0.25 };
const row = date => ({ date, ...model, totalCost: .25, totalTokens: 100, modelBreakdowns: [model] });

test('accepts legacy date and new period fields and sorts chronological rows', () => {
 const legacy = row('2026-09-20');
 const modern = { ...row('2026-09-19'), date: undefined, period: '2026-09-19' };
 const result = normalizeReport({ daily: [legacy, modern] });
 assert.deepEqual(result.daily.map(r => r.date), ['2026-09-19', '2026-09-20']);
 assert.equal(result.totals.totalCost, .5);
});
test('weekly boundaries are Sunday and timezone independent', () => {
 for (const tz of ['Asia/Kolkata', 'America/Los_Angeles', 'UTC']) {
  process.env.TZ = tz;
  assert.equal(periodKey('2026-09-20', 'weekly'), '2026-09-20');
  assert.equal(periodKey('2026-09-19', 'weekly'), '2026-09-13');
  assert.equal(addDays('2026-03-08', 6), '2026-03-14');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
 }
});
test('all period totals and every model reconcile, including duplicate dates', () => {
 const result = normalizeReport({ daily: [row('2026-01-31'),row('2026-02-01'),row('2026-02-01')] });
 for (const period of ['daily', 'weekly', 'monthly']) {
  assert.equal(result[period].reduce((sum,r) => sum+r.totalCost,0), .75);
  assert.equal(result[period].reduce((sum,r) => sum+r.totalTokens,0), 300);
  for (const r of result[period]) assert.equal(r.modelBreakdowns.reduce((sum,m) => sum+m.cost,0),r.totalCost);
 }
 assert.equal(result.daily.length, 2);
});
test('malformed dates, wrong agent scope and invalid amounts fail explicitly', () => {
 for (const bad of ['', '2026-02-30', '2026-13-01', undefined]) assert.throws(() => normalizeReport({daily:[row(bad)]}));
 for (const totalCost of [NaN, Infinity, -1, '3', undefined]) assert.throws(() => normalizeReport({daily:[{...row('2026-09-20'),totalCost}]}));
 assert.throws(() => normalizeReport({ daily:[{...row('2026-09-20'),agent:'all'}] }));
 assert.throws(() => normalizeReport({ totals:{} }));
});
test('empty usage is finite and unpriced model metadata survives', () => {
 const result = normalizeReport({ daily: [], totals:{ unpricedModels:['custom-model'] } });
 assert.equal(result.totals.totalCost,0);
 assert.equal(result.totals.totalTokens,0);
 assert.deepEqual(result.unpricedModels,['custom-model']);
});
test('missing breakdown is attributed explicitly rather than discarded', () => {
 const result = normalizeReport({ daily: [{...row('2026-09-20'),modelBreakdowns:undefined}] });
 assert.equal(result.daily[0].modelBreakdowns[0].modelName,'Unattributed usage');
 assert.equal(result.daily[0].modelBreakdowns[0].cost,.25);
});
test('informational prefixes before JSON are tolerated', () => {
 assert.deepEqual(parseReport('[ccusage] configuration loaded\n{"daily":[]}'), {daily:[]});
 assert.throws(() => parseReport('no report'));
});

test('partial model breakdown retains the unattributed remainder', () => {
 const result = normalizeReport({ daily:[{...row('2026-09-20'), inputTokens:20, totalTokens:110,totalCost:.5}] });
 const rest = result.daily[0].modelBreakdowns.find(m => m.modelName==='Unattributed usage');
 assert.equal(rest.inputTokens,10);
 assert.equal(rest.cost,.25);
});
test('inconsistent model or token totals cannot reach the dashboard', () => {
 assert.throws(() => normalizeReport({daily:[{...row('2026-09-20'),totalTokens:999}]}));
 assert.throws(() => normalizeReport({daily:[{...row('2026-09-20'),totalCost:0}]}));
});
