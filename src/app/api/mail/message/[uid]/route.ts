import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient, EmailDetail } from '@/lib/imap';
import { simpleParser } from 'mailparser';

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
    let emailDetail: EmailDetail | null = null;

    try {
      // Mark as seen
      await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });

      // Download message source
      const downloaded = await client.download(String(uid), undefined, { uid: true });
      if (downloaded && downloaded.content) {
        const parsed = await simpleParser(downloaded.content);

        const fromList = (parsed.from?.value || []).map(f => ({
          name: f.name || f.address || 'Unknown',
          address: f.address || ''
        }));

        const toList = (Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : []).flatMap(t =>
          (t.value || []).map(v => ({
            name: v.name || v.address || '',
            address: v.address || ''
          }))
        );

        const ccList = parsed.cc
          ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]).flatMap((c: any) =>
              (c.value || []).map((v: any) => ({
                name: v.name || v.address || '',
                address: v.address || ''
              }))
            )
          : [];

        const attachments = (parsed.attachments || []).map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          contentId: att.contentId
        }));

        // Extract security headers
        const headerLines = (parsed.headerLines || []) as { key: string; line: string }[];
        const getHeader = (name: string) => {
          const h = headerLines.find(l => l.key.toLowerCase() === name.toLowerCase());
          return h ? h.line.replace(/^[^:]+:\s*/i, '').trim() : undefined;
        };
        const authResults = getHeader('authentication-results') || '';
        const extractResult = (str: string, key: string) => {
          const m = str.match(new RegExp(`${key}=([a-zA-Z]+)`, 'i'));
          return m ? m[1].toLowerCase() : undefined;
        };

        const securityHeaders = {
          spf: extractResult(authResults, 'spf'),
          dkim: extractResult(authResults, 'dkim'),
          dmarc: extractResult(authResults, 'dmarc'),
          messageId: parsed.messageId || getHeader('message-id'),
          date: parsed.date?.toISOString(),
          returnPath: getHeader('return-path'),
        };

        const rawHeadersStr = headerLines.map(l => l.line).join('\r\n');

        emailDetail = {
          uid,
          seq: 0,
          subject: parsed.subject || '(no subject)',
          from: fromList,
          to: toList,
          cc: ccList,
          date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
          flags: ['\\Seen'],
          unread: false,
          starred: false,
          size: 0,
          snippet: parsed.text ? parsed.text.slice(0, 100) : '',
          html: parsed.html || undefined,
          text: parsed.text || undefined,
          textAsHtml: parsed.textAsHtml || undefined,
          attachments,
          headers: securityHeaders,
          rawHeaders: rawHeadersStr,
        };
      }
    } finally {
      lock.release();
    }

    await client.logout();

    if (!emailDetail) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: emailDetail });
  } catch (error: any) {
    console.error('Error fetching message details:', error);
    try { await client.logout(); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Failed to fetch email' }, { status: 500 });
  }
}
