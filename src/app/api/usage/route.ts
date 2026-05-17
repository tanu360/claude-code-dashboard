import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { DailyUsage, UsageResponse } from '@/types/usage';

const execAsync = promisify(exec);
const EXEC_OPTIONS = { maxBuffer: 1024 * 1024 * 20 };

type UsageTotals = UsageResponse['totals'];

type RawPeriodUsage = Omit<DailyUsage, 'date'> & {
  date?: string;
  week?: string;
  month?: string;
};

type CcusageReport = {
  daily?: RawPeriodUsage[];
  weekly?: RawPeriodUsage[];
  monthly?: RawPeriodUsage[];
  totals: UsageTotals;
};

async function checkAndInstallCcusage() {
  try {
    // Check if ccusage is available globally
    await execAsync('ccusage --version', EXEC_OPTIONS);
    return 'ccusage';
  } catch {
    // ccusage not found, install globally and use it
    try {
      await execAsync('npm install -g ccusage', EXEC_OPTIONS);
      return 'ccusage';
    } catch {
      // Fallback to npx if global install fails
      return 'npx ccusage';
    }
  }
}

function parseCcusageJson(stdout: string): CcusageReport {
  // ccusage can prepend informational lines like
  // "[ccusage] No valid configuration file found" before the JSON payload.
  const jsonStart = stdout.indexOf('{');

  if (jsonStart === -1) {
    throw new Error('ccusage did not return a JSON object');
  }

  return JSON.parse(stdout.slice(jsonStart));
}

function normalizePeriodRows(
  rows: RawPeriodUsage[] = [],
  getDate: (row: RawPeriodUsage) => string
): DailyUsage[] {
  return rows.map(({ week: _week, month: _month, date: _date, ...row }) => ({
    ...row,
    date: getDate({ ...row, week: _week, month: _month, date: _date }),
  }));
}

async function runCcusageReport(
  ccusageCommand: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<CcusageReport> {
  const { stdout } = await execAsync(`${ccusageCommand} ${period} --json --breakdown`, EXEC_OPTIONS);
  return parseCcusageJson(stdout);
}

export async function GET() {
  try {
    const ccusageCommand = await checkAndInstallCcusage();
    const [dailyReport, weeklyReport, monthlyReport] = await Promise.all([
      runCcusageReport(ccusageCommand, 'daily'),
      runCcusageReport(ccusageCommand, 'weekly'),
      runCcusageReport(ccusageCommand, 'monthly'),
    ]);

    const daily = normalizePeriodRows(
      dailyReport.daily,
      (row) => row.date || ''
    );

    const weekly = normalizePeriodRows(
      weeklyReport.weekly,
      (row) => row.week || row.date || ''
    );

    const monthly = normalizePeriodRows(
      monthlyReport.monthly,
      (row) => row.date || (row.month ? `${row.month}-01` : '')
    );

    return NextResponse.json({
      daily,
      weekly,
      monthly,
      totals: dailyReport.totals || weeklyReport.totals || monthlyReport.totals,
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
