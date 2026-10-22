import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';
import { createImapClient } from '@/lib/imap';
import { createTrackingRecord } from '@/lib/tracking';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html: htmlField,
      body: bodyField,
      attachments,
      priority,
      requestReadReceipt,
      trackEmail,
    } = body;
    let html = htmlField || bodyField;

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

    // Email Tracking via Streak pixel
    let trackingId: string | undefined;
    if (trackEmail === true) {
      trackingId = 'trk_' + crypto.randomUUID();
      customHeaders['X-Tracking-ID'] = trackingId;
      const trackingPixel = `<img src="https://mail.foryourgoal.com/api/tracking/open/${trackingId}" width="1" height="1" style="display:none!important;" alt="" />`;
      if (html) {
        html = `${html}${trackingPixel}`;
      } else if (text) {
        html = `<div style="font-family: sans-serif; font-size: 14px; color: #202124;">${text.replace(/\n/g, '<br/>')}</div>${trackingPixel}`;
      } else {
        html = trackingPixel;
      }
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

    // Save tracking record if tracking is enabled
    if (trackingId) {
      try {
        await createTrackingRecord({
          id: trackingId,
          senderEmail: session.email,
          recipientEmail: Array.isArray(to) ? to.join(', ') : String(to),
          subject: subject || '(no subject)',
          messageId: info.messageId,
        });
      } catch (trackErr) {
        console.error('Failed to create initial tracking record:', trackErr);
      }
    }

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
