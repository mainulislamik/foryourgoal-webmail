import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { encryptSession, COOKIE_NAME } from '@/lib/auth';

const SSO_SECRET = Buffer.from(
  (process.env.SSO_SECRET || process.env.AUTH_SECRET || 'foryourgoal_mail_secret_key_2026_material_workspace_secure_token_993!').padEnd(32, '0').slice(0, 32)
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=sso_failed', request.url));
  }

  let email: string;
  let impersonatedBy: string | undefined;

  try {
    const { payload } = await jwtVerify(token, SSO_SECRET);
    if (!payload.email || typeof payload.email !== 'string') {
      return NextResponse.redirect(new URL('/login?error=sso_failed', request.url));
    }
    email = payload.email;
    impersonatedBy = typeof payload.impersonatedBy === 'string' ? payload.impersonatedBy : undefined;
  } catch {
    return NextResponse.redirect(new URL('/login?error=sso_failed', request.url));
  }

  const sessionToken = await encryptSession({ email, isMasterAuth: true, impersonatedBy });

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 3600,
  });

  return response;
}
