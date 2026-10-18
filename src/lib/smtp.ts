import nodemailer from 'nodemailer';
import { UserSession } from './auth';

export interface SendMailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}

export async function sendEmail(session: UserSession, options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: session.email,
      pass: session.password || ''
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const fromAddress = session.displayName 
    ? `"${session.displayName}" <${session.email}>` 
    : session.email;

  const result = await transporter.sendMail({
    from: fromAddress,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments
  });

  return result;
}
