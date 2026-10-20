import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient } from '@/lib/imap';
import { simpleParser } from 'mailparser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string; index: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { uid: uidParam, index: indexParam } = await params;
  const uid = parseInt(uidParam, 10);
  const index = parseInt(indexParam, 10);
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'INBOX';

  if (!uid || isNaN(uid) || isNaN(index) || index < 0) {
    return NextResponse.json({ error: 'Invalid UID or attachment index' }, { status: 400 });
  }

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    let attachmentBuffer: Buffer | null = null;
    let contentType = 'application/octet-stream';
    let filename = `attachment-${index}`;

    try {
      const downloaded = await client.download(String(uid), undefined, { uid: true });
      if (downloaded && downloaded.content) {
        const parsed = await simpleParser(downloaded.content);
        const attachments = parsed.attachments || [];
        const att = attachments[index];
        if (att) {
          attachmentBuffer = att.content;
          contentType = att.contentType || 'application/octet-stream';
          filename = att.filename || filename;
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    if (!attachmentBuffer) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const encodedFilename = encodeURIComponent(filename);
    return new Response(new Uint8Array(attachmentBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': String(attachmentBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('Error downloading attachment:', error);
    try { await client.logout(); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Failed to download attachment' }, { status: 500 });
  }
}
