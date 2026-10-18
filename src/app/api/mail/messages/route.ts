import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient, EmailHeader } from '@/lib/imap';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'INBOX';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
  const category = searchParams.get('category') || 'primary';
  const query = searchParams.get('q') || '';

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    const messages: EmailHeader[] = [];
    let totalMessages = 0;

    try {
      const mailbox = client.mailbox;
      totalMessages = mailbox && typeof mailbox !== 'boolean' ? mailbox.exists : 0;

      if (totalMessages > 0) {
        // Fetch all sequence numbers or a slice
        // Fetch sequence from 1 to totalMessages
        for await (let msg of client.fetch('1:*', {
          envelope: true,
          flags: true,
          size: true,
          bodyStructure: true
        })) {
          const flags = Array.from(msg.flags || []);
          const unread = !flags.includes('\\Seen');
          const starred = flags.includes('\\Flagged');

          const fromList = (msg.envelope?.from || []).map(f => ({
            name: f.name || f.address || 'Unknown',
            address: f.address || ''
          }));

          const toList = (msg.envelope?.to || []).map(t => ({
            name: t.name || t.address || '',
            address: t.address || ''
          }));

          const subject = msg.envelope?.subject || '(no subject)';
          const date = msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString();

          messages.push({
            uid: msg.uid,
            seq: msg.seq,
            subject,
            from: fromList,
            to: toList,
            date,
            flags,
            unread,
            starred,
            size: msg.size || 0,
            snippet: subject
          });
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Sort newest first
    messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Search filter
    let filtered = messages;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.from.some(f => f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q))
      );
    }

    // Gmail Category filter simulation:
    // If category is set and in INBOX:
    // promotions: newsletters, offers, marketing
    // social: social networks, media
    // updates: google account alerts, security alerts, receipts, verification codes
    // primary: personal or default
    if (folder.toUpperCase() === 'INBOX' && !query) {
      if (category === 'updates') {
        filtered = filtered.filter(m => {
          const text = (m.subject + ' ' + m.from[0]?.address).toLowerCase();
          return text.includes('security') || text.includes('alert') || text.includes('verify') || text.includes('update') || text.includes('confirm') || text.includes('notice');
        });
      } else if (category === 'social') {
        filtered = filtered.filter(m => {
          const text = (m.subject + ' ' + m.from[0]?.address).toLowerCase();
          return text.includes('facebook') || text.includes('twitter') || text.includes('linkedin') || text.includes('instagram') || text.includes('community');
        });
      } else if (category === 'promotions') {
        filtered = filtered.filter(m => {
          const text = (m.subject + ' ' + m.from[0]?.address).toLowerCase();
          return text.includes('deal') || text.includes('discount') || text.includes('offer') || text.includes('promo') || text.includes('newsletter');
        });
      } else if (category === 'primary') {
        filtered = filtered.filter(m => {
          const text = (m.subject + ' ' + m.from[0]?.address).toLowerCase();
          const isPromo = text.includes('deal') || text.includes('discount') || text.includes('promo');
          const isSocial = text.includes('facebook') || text.includes('twitter') || text.includes('linkedin');
          return !isPromo && !isSocial;
        });
      }
    }

    const startIdx = (page - 1) * pageSize;
    const paginated = filtered.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      messages: paginated,
      total: filtered.length,
      page,
      pageSize
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    try { await client.logout(); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Failed to fetch messages' }, { status: 500 });
  }
}
