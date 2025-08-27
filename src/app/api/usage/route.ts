import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkAndInstallCcusage() {
  try {
    // Check if ccusage is available globally
    await execAsync('ccusage --version');
    return 'ccusage';
  } catch {
    // ccusage not found, install globally and use it
    try {
      await execAsync('npm install -g ccusage');
      return 'ccusage';
    } catch {
      // Fallback to npx if global install fails
      return 'npx ccusage';
    }
  }
}

export async function GET() {
  try {
    const ccusageCommand = await checkAndInstallCcusage();
    const { stdout } = await execAsync(`${ccusageCommand} daily --json`);
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}