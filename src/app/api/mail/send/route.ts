import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';
import { createImapClient } from '@/lib/imap';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, cc, bcc, subject, text, html: htmlField, body: bodyField, attachments, priority, requestReadReceipt } = body;
    const html = htmlField || bodyField;

    if (!to || (!subject && !text && !html && !bodyField)) {
      return NextResponse.json({ error: 'Recipient and content are required' }, { status: 400 });
    }

    // Format attachments if provided
    const formattedAttachments = Array.isArray(attachments)
      ? attachments.map((att: any) => ({
          filename: att.filename,
          content: typeof att.content === 'string' && att.content.includes(';base64,')
            ? Buffer.from(att.content.split(';base64,')[1], 'base64')
            : typeof att.content === 'string'
            ? Buffer.from(att.content, 'base64')
            : att.content,
          contentType: att.contentType,
        }))
      : undefined;

    // Build custom headers for priority and read receipts
    const customHeaders: Record<string, string> = {};
    if (priority === 'high' || priority === 'urgent') {
      customHeaders['X-Priority'] = '1';
      customHeaders['Importance'] = 'high';
      customHeaders['X-MS-Exchange-MessageSentRepresentingType'] = '1';
    } else if (priority === 'low') {
      customHeaders['X-Priority'] = '5';
      customHeaders['Importance'] = 'low';
    }
    if (requestReadReceipt && typeof requestReadReceipt === 'boolean') {
      customHeaders['Disposition-Notification-To'] = session.email;
    }

    // Send email via SMTP
    const info = await sendEmail(session, {
      to,
      cc,
      bcc,
      subject: subject || '(no subject)',
      text,
      html: html || (text ? `<div style="font-family: sans-serif; font-size: 14px; color: #202124;">${text.replace(/\n/g, '<br/>')}</div>` : ''),
      attachments: formattedAttachments,
      headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
    });

    // Optionally append to Sent mailbox
    try {
      const client = createImapClient(session);
      await client.connect();
      // Find Sent folder
      const mailboxes = await client.list();
      const sentBox = mailboxes.find(m => m.specialUse === '\\Sent' || m.path.toLowerCase() === 'sent');
      if (sentBox) {
        // Simple raw message append if needed
      }
      await client.logout();
    } catch (e) {
      // Non-fatal if append fails
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error('Send mail error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
