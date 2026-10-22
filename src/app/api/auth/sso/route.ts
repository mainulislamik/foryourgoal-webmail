import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { encryptSession, COOKIE_NAME } from '@/lib/auth';

const getSecretKey = () =>
  new TextEncoder().encode(
    process.env.SSO_SECRET || process.env.AUTH_SECRET || 'foryourgoal_mail_secret_key_2026_material_workspace_secure_token_993!'
  );

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'mail.foryourgoal.com';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
  }

  let email: string;
  let impersonatedBy: string | undefined;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.email || typeof payload.email !== 'string') {
      return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
    }
    email = payload.email;
    impersonatedBy = typeof payload.impersonatedBy === 'string' ? payload.impersonatedBy : undefined;
  } catch (err) {
    console.error('SSO token verification failed:', err);
    return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
  }

  const sessionToken = await encryptSession({ email, isMasterAuth: true, impersonatedBy });

  const response = NextResponse.redirect(new URL('/', baseUrl));
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 3600,
    domain: process.env.NODE_ENV === 'production' ? '.foryourgoal.com' : undefined,
  });

  return response;
}
