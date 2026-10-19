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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format. Allowed: JPG, PNG, WEBP, GIF, SVG' }, { status: 400 });
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image file size exceeds 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = session.email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = file.type === 'image/png'
      ? '.png'
      : file.type === 'image/webp'
      ? '.webp'
      : file.type === 'image/gif'
      ? '.gif'
      : file.type === 'image/svg+xml'
      ? '.svg'
      : '.jpg';

    const filename = `${safeName}_sig_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'signatures');

    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const host = request.headers.get('host') || 'mail.foryourgoal.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const absoluteUrl = `${protocol}://${host}/signatures/${filename}`;
    const relativeUrl = `/signatures/${filename}`;

    return NextResponse.json({
      success: true,
      url: absoluteUrl,
      relativeUrl,
    });
  } catch (error: any) {
    console.error('Signature image upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
  }
}
