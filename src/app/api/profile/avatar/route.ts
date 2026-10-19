import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get('file') || formData.get('avatar')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeName = session.email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const filename = `${safeName}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'avatars');

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const avatarUrl = `/avatars/${filename}?t=${Date.now()}`;
    return NextResponse.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  const safeName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uploadDir = path.join(process.cwd(), 'public', 'avatars');

  // Check if custom avatar exists
  for (const ext of ['.jpg', '.png', '.webp']) {
    try {
      const p = path.join(uploadDir, `${safeName}${ext}`);
      const stat = await fs.stat(p);
      return NextResponse.json({ avatarUrl: `/avatars/${safeName}${ext}?t=${Math.floor(stat.mtimeMs)}` });
    } catch (e) {}
  }

  return NextResponse.json({ avatarUrl: null });
}
