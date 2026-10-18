import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient, FolderInfo } from '@/lib/imap';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = createImapClient(session);
  try {
    await client.connect();
    const mailboxes = await client.list();
    const folders: FolderInfo[] = [];

    for (const mb of mailboxes) {
      let unreadCount = 0;
      let totalCount = 0;
      try {
        const status = await client.status(mb.path, { unseen: true, messages: true });
        unreadCount = status.unseen || 0;
        totalCount = status.messages || 0;
      } catch (e) {
        // status might fail on non-selectable folders
      }

      folders.push({
        path: mb.path,
        name: mb.name,
        specialUse: mb.specialUse,
        unreadCount,
        totalCount
      });
    }

    await client.logout();
    return NextResponse.json({ folders });
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    try { await client.logout(); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Failed to list folders' }, { status: 500 });
  }
}
