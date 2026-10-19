import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const SIGNATURES_DIR = path.join(process.cwd(), 'data', 'signatures');

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const safeName = session.email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(SIGNATURES_DIR, `${safeName}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      return NextResponse.json({
        signature: parsed.signature || '',
        updatedAt: parsed.updatedAt || null,
      });
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return NextResponse.json({ signature: '', updatedAt: null });
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Error fetching signature:', error);
    return NextResponse.json({ error: error?.message || 'Failed to read signature' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const signature = typeof body.signature === 'string' ? body.signature : '';

    const safeName = session.email.replace(/[^a-zA-Z0-9.-]/g, '_');
    await fs.mkdir(SIGNATURES_DIR, { recursive: true });

    const filePath = path.join(SIGNATURES_DIR, `${safeName}.json`);
    const payload = {
      email: session.email,
      signature,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    return NextResponse.json({ success: true, signature, updatedAt: payload.updatedAt });
  } catch (error: any) {
    console.error('Error saving signature:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save signature' }, { status: 500 });
  }
}
