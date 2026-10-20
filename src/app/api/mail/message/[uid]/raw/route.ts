import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient } from '@/lib/imap';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { uid: uidParam } = await params;
  const uid = parseInt(uidParam, 10);
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'INBOX';

  if (!uid || isNaN(uid)) {
    return NextResponse.json({ error: 'Invalid UID' }, { status: 400 });
  }

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    let rawBuffer: Buffer | null = null;

    try {
      const downloaded = await client.download(String(uid), undefined, { uid: true });
      if (downloaded && downloaded.content) {
        const chunks: Buffer[] = [];
        for await (const chunk of downloaded.content) {
          chunks.push(chunk);
        }
        rawBuffer = Buffer.concat(chunks);
      }
    } finally {
      lock.release();
    }

    await client.logout();

    if (!rawBuffer) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return new Response(new Uint8Array(rawBuffer), {
      headers: {
        'Content-Type': 'message/rfc822',
        'Content-Disposition': `attachment; filename="message-${uid}.eml"`,
        'Content-Length': String(rawBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('Error downloading raw message:', error);
    try { await client.logout(); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Failed to download email' }, { status: 500 });
  }
}
