import type { DailyUsage, ModelBreakdown, UsageResponse } from '../types/usage';

export const emptyTotals = (): UsageResponse['totals'] => ({
  inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
  totalTokens: 0, totalCost: 0,
});

export function dateKey(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error('Usage report contains an invalid date');
  }
  return value;
}

export function addDays(key: string, days: number): string {
  const date = new Date(`${dateKey(key)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function periodKey(key: string, period: 'daily' | 'weekly' | 'monthly'): string {
  dateKey(key);
  if (period === 'monthly') return `${key.slice(0, 7)}-01`;
  if (period === 'weekly') return addDays(key, -new Date(`${key}T00:00:00Z`).getUTCDay());
  return key;
}

export function sumRows(rows: DailyUsage[]): UsageResponse['totals'] {
  return rows.reduce((sum, row) => {
    for (const field of Object.keys(sum) as (keyof typeof sum)[]) sum[field] += row[field];
    return sum;
  }, emptyTotals());
}

export function allTimeCostComparison(rows: DailyUsage[], asOf: string) {
  const history = rows.filter(row => row.date <= asOf);
  if (!history.length) return null;
  const firstDate = history.reduce((first, row) => row.date < first ? row.date : first, history[0].date);
  const days = Math.round((Date.parse(asOf) - Date.parse(firstDate)) / 86400000) + 1;
  if (days < 2) return null;
  const earlierDays = Math.floor(days / 2);
  const midpoint = addDays(firstDate, earlierDays);
  let earlierCost = 0;
  let recentCost = 0;
  for (const row of history) {
    if (row.date < midpoint) earlierCost += row.totalCost;
    else recentCost += row.totalCost;
  }
  // Calendar-day averages keep gaps and unequal half lengths comparable.
  return { previous: earlierCost / earlierDays, current: recentCost / (days - earlierDays) };
}

export function aggregateRows(rows: DailyUsage[], period: 'daily' | 'weekly' | 'monthly'): DailyUsage[] {
  const groups = new Map<string, DailyUsage[]>();
  for (const row of rows) {
    const key = periodKey(row.date, period);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  return Array.from(groups, ([date, days]) => {
    const models = new Map<string, ModelBreakdown>();
    for (const day of days) for (const model of day.modelBreakdowns || []) {
      const sum = models.get(model.modelName) || {
        modelName: model.modelName, inputTokens: 0, outputTokens: 0,
        cacheCreationTokens: 0, cacheReadTokens: 0, cost: 0,
      };
      for (const key of ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens', 'cost'] as const) sum[key] += model[key];
      models.set(model.modelName, sum);
    }
    return { date, ...sumRows(days), modelsUsed: Array.from(new Set(days.flatMap(day => day.modelsUsed || []))), modelBreakdowns: Array.from(models.values()) };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid usage report object');
  return value as Record<string, unknown>;
}

function number(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Invalid usage field: ${field}`);
  return value;
}

function tokens(row: Record<string, unknown>) {
  return {
    inputTokens: number(row.inputTokens, 'inputTokens'),
    outputTokens: number(row.outputTokens, 'outputTokens'),
    cacheCreationTokens: number(row.cacheCreationTokens ?? 0, 'cacheCreationTokens'),
    cacheReadTokens: number(row.cacheReadTokens ?? 0, 'cacheReadTokens'),
  };
}

export function normalizeReport(value: unknown): UsageResponse {
  const report = record(value);
  if (!Array.isArray(report.daily)) throw new Error('Usage report is missing daily rows');
  const rows = report.daily.map(value => {
    const row = record(value);
    if (row.agent && row.agent !== 'claude') throw new Error('Expected Claude Code usage, received a different agent scope');
    const counts = tokens(row);
    const totalTokens = Object.values(counts).reduce((a, b) => a + b, 0);
    if (row.totalTokens !== undefined && number(row.totalTokens, 'totalTokens') !== totalTokens) {
      throw new Error('Usage token totals do not reconcile');
    }
    const totalCost = number(row.totalCost, 'totalCost');
    const models = (Array.isArray(row.modelBreakdowns) ? row.modelBreakdowns : []).map(value => {
      const model = record(value);
      return { ...tokens(model), cost: number(model.cost, 'model cost'), modelName: typeof model.modelName === 'string' && model.modelName.trim() ? model.modelName.trim() : 'Unknown model' };
    });
    const remainder = { ...counts, cost: totalCost, modelName: 'Unattributed usage' };
    for (const model of models) for (const key of ['inputTokens', 'outputTokens', 'cacheCreationTokens', 'cacheReadTokens', 'cost'] as const) remainder[key] -= model[key];
    if (Object.entries(remainder).some(([key, value]) => key !== 'modelName' && (value as number) < -0.000001)) {
      throw new Error('Model breakdown exceeds usage totals');
    }
    if (remainder.inputTokens + remainder.outputTokens + remainder.cacheCreationTokens + remainder.cacheReadTokens > 0 || remainder.cost > 0.000001) {
      remainder.cost = Math.max(0, remainder.cost);
      models.push(remainder);
    }
    return { date: dateKey(row.date ?? row.period), ...counts, totalTokens, totalCost,
      modelsUsed: Array.from(new Set(models.map(model => model.modelName))), modelBreakdowns: models };
  });
  const daily = aggregateRows(rows, 'daily');
  const rawTotals = report.totals ? record(report.totals) : {};
  return {
    daily, weekly: aggregateRows(daily, 'weekly'), monthly: aggregateRows(daily, 'monthly'), totals: sumRows(daily),
    unpricedModels: Array.isArray(rawTotals.unpricedModels) ? rawTotals.unpricedModels.filter((name): name is string => typeof name === 'string') : [],
  };
}

export function parseReport(stdout: string): unknown {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('ccusage did not return JSON');
  return JSON.parse(stdout.slice(start));
}
