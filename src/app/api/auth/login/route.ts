import { NextRequest, NextResponse } from 'next/server';
import { createImapClient } from '@/lib/imap';
import { encryptSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const client = createImapClient({ email, password });
    await client.connect();
    await client.logout();

    // Default display name if imon.khan
    let displayName = email.split('@')[0].replace('.', ' ').toUpperCase();
    if (email.startsWith('imon')) {
      displayName = 'IMON KHAN';
    }

    const sessionData = {
      email,
      password,
      displayName
    };

    const encrypted = await encryptSession(sessionData);

    const response = NextResponse.json({
      success: true,
      user: {
        email,
        displayName
      }
    });

    response.cookies.set(COOKIE_NAME, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Invalid email or password';
    if (error?.authenticationFailed || 
        error?.response?.includes('AUTHENTICATIONFAILED') || 
        error?.message === 'Command failed') {
      errorMessage = 'Invalid email or password. Please check your credentials.';
    } else if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timed out')) {
      errorMessage = 'Connection to mail server timed out. Please try again.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
