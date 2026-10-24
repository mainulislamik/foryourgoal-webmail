import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/smtp';
import { createImapClient } from '@/lib/imap';
import { createTrackingRecord } from '@/lib/tracking';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

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
    const formattedAttachments: any[] = Array.isArray(attachments)
      ? attachments.map((att: any) => ({
          filename: att.filename,
          content: typeof att.content === 'string' && att.content.includes(';base64,')
            ? Buffer.from(att.content.split(';base64,')[1], 'base64')
            : typeof att.content === 'string'
            ? Buffer.from(att.content, 'base64')
            : att.content,
          contentType: att.contentType,
          cid: att.cid,
          contentDisposition: att.contentDisposition || 'attachment',
        }))
      : [];

    // Auto CID inline embedding for ForYourGoal logo in HTML emails
    if (html && typeof html === 'string') {
      const logoUrlRegex = /https?:\/\/(mail\.)?foryourgoal\.com\/images\/foryourgoal-logo\.png/gi;
      if (logoUrlRegex.test(html)) {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'foryourgoal-logo.png');
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          html = html.replace(logoUrlRegex, 'cid:foryourgoal-logo@foryourgoal.com');
          formattedAttachments.push({
            filename: 'foryourgoal-logo.png',
            content: logoBuffer,
            contentType: 'image/png',
            cid: 'foryourgoal-logo@foryourgoal.com',
            contentDisposition: 'inline',
          });
        } else {
          html = html.replace(/https:\/\/foryourgoal\.com\/images\/foryourgoal-logo\.png/g, 'https://mail.foryourgoal.com/images/foryourgoal-logo.png');
        }
      }
    }

    // Build custom headers for priority, read receipts, and unsubscribe
    const customHeaders: Record<string, string> = {
      'List-Unsubscribe': '<mailto:support@foryourgoal.com?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
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

    const htmlContent = html || (text ? `<div style="font-family: sans-serif; font-size: 14px; color: #202124;">${text.replace(/\n/g, '<br/>')}</div>` : '');

    // Send email via SMTP
    const info: any = await sendEmail(session, {
      to,
      cc,
      bcc,
      subject: subject || '(no subject)',
      text,
      html: htmlContent,
      attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined,
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

    // Append to Sent mailbox
    try {
      const MailComposer = require('nodemailer/lib/mail-composer');
      const fromAddress = session.displayName
        ? `"${session.displayName}" <${session.email}>`
        : session.email;

      const mailOptions = {
        from: fromAddress,
        to,
        cc,
        bcc,
        subject: subject || '(no subject)',
        text,
        html: htmlContent,
        messageId: info.messageId,
        date: new Date(),
        attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined,
        headers: customHeaders,
      };

      const rawBuffer = await new Promise<Buffer>((resolve, reject) => {
        new MailComposer(mailOptions).compile().build((err: any, message: Buffer) => {
          if (err) reject(err);
          else resolve(message);
        });
      });

      const client = createImapClient(session);
      try {
        await client.connect();
        // Find Sent folder
        const mailboxes = await client.list();
        const sentBox = mailboxes.find(
          (m) =>
            m.specialUse === '\\Sent' ||
            m.path.toLowerCase() === 'sent' ||
            m.name.toLowerCase() === 'sent'
        );
        if (sentBox) {
          await client.append(sentBox.path, rawBuffer, ['\\Seen']);
        }
      } finally {
        try {
          await client.logout();
        } catch {
          // ignore logout error
        }
      }
    } catch (e) {
      console.error('Failed to append to Sent mailbox:', e);
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
