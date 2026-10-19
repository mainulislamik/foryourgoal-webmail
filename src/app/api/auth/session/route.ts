import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let avatarUrl = session.avatarUrl || null;
  if (!avatarUrl && session.email) {
    const safeName = session.email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uploadDir = path.join(process.cwd(), 'public', 'avatars');
    for (const ext of ['.jpg', '.png', '.webp']) {
      try {
        const p = path.join(uploadDir, `${safeName}${ext}`);
        const stat = await fs.stat(p);
        avatarUrl = `/avatars/${safeName}${ext}?t=${Math.floor(stat.mtimeMs)}`;
        break;
      } catch (e) {}
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      displayName: session.displayName || session.email,
      avatarUrl,
      isMasterAuth: session.isMasterAuth,
      impersonatedBy: session.impersonatedBy,
    }
  });
}
