import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { normalizeReport, parseReport } from '@/lib/usage';

const run = promisify(execFile);
const options = { maxBuffer: 20 * 1024 * 1024, timeout: 120_000 };
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { stdout: help } = await run('ccusage', ['--help'], options);
    // New ccusage releases default to all agents; older releases are Claude-only.
    const prefix = /^\s+claude\s/m.test(help) ? ['claude'] : [];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { stdout } = await run('ccusage', [...prefix, 'daily', '--json', '--breakdown', '--timezone', timezone], options);
    const report = normalizeReport(parseReport(stdout));
    return NextResponse.json({ ...report, timezone, asOf: new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), source: 'Claude Code local logs' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Unable to read Claude Code usage. Check that ccusage is installed and its daily JSON report is valid.' }, { status: 500 });
  }
}
