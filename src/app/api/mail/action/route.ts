import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient } from '@/lib/imap';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, uids, folder = 'INBOX', targetFolder } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // empty-folder doesn't require UIDs
    if (action !== 'empty-folder' && (!uids || !Array.isArray(uids) || uids.length === 0)) {
      return NextResponse.json({ error: 'Action and array of UIDs required' }, { status: 400 });
    }

    const client = createImapClient(session);
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const uidRange = uids.join(',');

      switch (action) {
        case 'markRead':
          await client.messageFlagsAdd(uidRange, ['\\Seen'], { uid: true });
          break;

        case 'markUnread':
          await client.messageFlagsRemove(uidRange, ['\\Seen'], { uid: true });
          break;

        case 'star':
          await client.messageFlagsAdd(uidRange, ['\\Flagged'], { uid: true });
          break;

        case 'unstar':
          await client.messageFlagsRemove(uidRange, ['\\Flagged'], { uid: true });
          break;

        case 'trash':
        case 'delete':
          // If in Trash already, delete permanently
          if (folder.toLowerCase() === 'trash') {
            await client.messageDelete(uidRange, { uid: true });
          } else {
            // Move to Trash mailbox
            const mailboxes = await client.list();
            const trashBox = mailboxes.find(
              m => m.specialUse === '\\Trash' || m.path.toLowerCase() === 'trash'
            );
            if (trashBox) {
              await client.messageMove(uidRange, trashBox.path, { uid: true });
            } else {
              await client.messageDelete(uidRange, { uid: true });
            }
          }
          break;

        case 'move':
          if (targetFolder) {
            await client.messageMove(uidRange, targetFolder, { uid: true });
          }
          break;

        case 'empty-folder': {
          // Search all messages and permanently delete them
          const allUids = await client.search({ all: true }, { uid: true });
          if (allUids && allUids.length > 0) {
            const range = allUids.join(',');
            await client.messageDelete(range, { uid: true });
          }
          break;
        }

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mail action error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to perform mail action' },
      { status: 500 }
    );
  }
}
