import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if API key is configured
  const expectedApiKey = process.env.NEXT_PUBLIC_API_KEY;

  // If no API key is set, allow all requests (local development)
  if (!expectedApiKey) {
    return NextResponse.next();
  }

  // Check for API key in request headers
  const providedApiKey = request.headers.get('x-api-key');

  if (!providedApiKey || providedApiKey !== expectedApiKey) {
    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid API key required'
      }),
      {
        status: 401,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};