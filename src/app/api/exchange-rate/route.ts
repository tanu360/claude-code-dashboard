import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Exchange rate service unavailable');
    const data = await response.json();
    const rate = data.rates?.INR;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || typeof data.date !== 'string') {
      throw new Error('Invalid exchange rate response');
    }
    return NextResponse.json({ date: data.date, rate });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ error: 'Exchange rate unavailable. Enter a manual rate to use INR.' }, { status: 502 });
  }
}
