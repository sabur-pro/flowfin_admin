import { NextResponse } from 'next/server';
import { env } from '@/infrastructure/config/env';

export function GET(): NextResponse {
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: '/login' },
  });

  response.cookies.delete(env.sessionCookieName());
  return response;
}
