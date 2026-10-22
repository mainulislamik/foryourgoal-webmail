import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getForYourGoalSignatureTemplate } from '@/lib/signature';
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
      let signature = parsed.signature || '';
      if (signature.includes('https://foryourgoal.com/images/foryourgoal-logo.png')) {
        signature = signature.replace(/https:\/\/foryourgoal\.com\/images\/foryourgoal-logo\.png/g, 'https://mail.foryourgoal.com/images/foryourgoal-logo.png');
      }
      return NextResponse.json({
        email: session.email,
        signature: signature,
        updatedAt: parsed.updatedAt || null,
      });
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        const defaultSig = getForYourGoalSignatureTemplate(session.displayName, session.email);
        return NextResponse.json({ email: session.email, signature: defaultSig, updatedAt: null });
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
