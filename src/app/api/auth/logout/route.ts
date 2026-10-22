import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  if (process.env.NODE_ENV === 'production') {
    response.cookies.set(COOKIE_NAME, '', {
      path: '/',
      domain: '.foryourgoal.com',
      maxAge: 0,
      expires: new Date(0),
    });
  }
  return response;
}
