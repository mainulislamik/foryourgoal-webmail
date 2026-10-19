import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] | string }> }
) {
  try {
    const resolvedParams = await params;
    const rawFilename = Array.isArray(resolvedParams.filename)
      ? resolvedParams.filename.join('/')
      : resolvedParams.filename;

    if (!rawFilename) {
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    // Prevent directory traversal
    const basename = path.basename(rawFilename);
    const filePath = path.join(process.cwd(), 'public', 'avatars', basename);

    const buffer = await fs.readFile(filePath);

    const ext = path.extname(basename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
  }
}
