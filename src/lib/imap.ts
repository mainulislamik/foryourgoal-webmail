import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { UserSession } from './auth';

export function createImapClient(session: UserSession): ImapFlow {
  return new ImapFlow({
    host: process.env.IMAP_HOST || '127.0.0.1',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: session.email,
      pass: session.password || ''
    },
    tls: {
      rejectUnauthorized: false
    },
    logger: false
  });
}

export interface FolderInfo {
  path: string;
  name: string;
  specialUse?: string;
  unreadCount: number;
  totalCount: number;
}

export interface EmailHeader {
  uid: number;
  seq: number;
  subject: string;
  from: { name: string; address: string }[];
  to: { name: string; address: string }[];
  date: string;
  flags: string[];
  unread: boolean;
  starred: boolean;
  size: number;
  snippet?: string;
}

export interface EmailDetail extends EmailHeader {
  html?: string;
  text?: string;
  textAsHtml?: string;
  attachments?: {
    filename?: string;
    contentType: string;
    size: number;
    contentId?: string;
  }[];
}
