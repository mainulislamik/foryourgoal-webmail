import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export interface TrackingOpenEvent {
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface TrackingRecord {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  messageId?: string;
  threadId?: string;
  createdAt: string;
  opened: boolean;
  openCount: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  opens: TrackingOpenEvent[];
}

export function getTrackingDir(): string {
  try {
    if (fsSync.existsSync('/app/data')) {
      return path.join('/app/data', 'tracking');
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), 'data', 'tracking');
}

function getRecordPath(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getTrackingDir(), `${safeId}.json`);
}

function getUserIndexPath(userEmail: string): string {
  const safeEmail = userEmail.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  return path.join(getTrackingDir(), `user_${safeEmail}.json`);
}

export async function createTrackingRecord(data: {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  messageId?: string;
  threadId?: string;
}): Promise<TrackingRecord> {
  const dir = getTrackingDir();
  await fs.mkdir(dir, { recursive: true });

  const now = new Date().toISOString();
  const record: TrackingRecord = {
    id: data.id,
    senderEmail: data.senderEmail.toLowerCase(),
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    messageId: data.messageId,
    threadId: data.threadId,
    createdAt: now,
    opened: false,
    openCount: 0,
    opens: [],
  };

  // Save individual record
  await fs.writeFile(getRecordPath(data.id), JSON.stringify(record, null, 2), 'utf-8');

  // Maintain user index of tracking IDs
  try {
    const userIndexFile = getUserIndexPath(data.senderEmail);
    let ids: string[] = [];
    try {
      const existing = await fs.readFile(userIndexFile, 'utf-8');
      ids = JSON.parse(existing);
      if (!Array.isArray(ids)) ids = [];
    } catch {
      ids = [];
    }
    if (!ids.includes(data.id)) {
      ids.unshift(data.id);
    }
    await fs.writeFile(userIndexFile, JSON.stringify(ids, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to update tracking user index:', err);
  }

  return record;
}

export async function getTrackingRecord(id: string): Promise<TrackingRecord | null> {
  try {
    const raw = await fs.readFile(getRecordPath(id), 'utf-8');
    return JSON.parse(raw) as TrackingRecord;
  } catch {
    return null;
  }
}

export async function recordOpenEvent(
  id: string,
  event: { ip?: string; userAgent?: string }
): Promise<TrackingRecord | null> {
  const record = await getTrackingRecord(id);
  if (!record) return null;

  const now = new Date().toISOString();
  record.opened = true;
  record.openCount = (record.openCount || 0) + 1;
  if (!record.firstOpenedAt) {
    record.firstOpenedAt = now;
  }
  record.lastOpenedAt = now;
  if (!Array.isArray(record.opens)) {
    record.opens = [];
  }

  record.opens.push({
    timestamp: now,
    ip: event.ip,
    userAgent: event.userAgent,
  });

  const dir = getTrackingDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getRecordPath(id), JSON.stringify(record, null, 2), 'utf-8');

  return record;
}

export async function getTrackingRecordsForUser(userEmail: string): Promise<TrackingRecord[]> {
  const dir = getTrackingDir();
  await fs.mkdir(dir, { recursive: true });

  const userIndexFile = getUserIndexPath(userEmail);
  try {
    const raw = await fs.readFile(userIndexFile, 'utf-8');
    const ids: string[] = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];

    const records: TrackingRecord[] = [];
    for (const id of ids) {
      const rec = await getTrackingRecord(id);
      if (rec) {
        records.push(rec);
      }
    }
    return records;
  } catch {
    // If index doesn't exist, scan directory files for this sender
    try {
      const files = await fs.readdir(dir);
      const records: TrackingRecord[] = [];
      const normalizedEmail = userEmail.toLowerCase();

      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('user_')) {
          try {
            const raw = await fs.readFile(path.join(dir, file), 'utf-8');
            const rec = JSON.parse(raw) as TrackingRecord;
            if (rec && rec.senderEmail && rec.senderEmail.toLowerCase() === normalizedEmail) {
              records.push(rec);
            }
          } catch {}
        }
      }
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return records;
    } catch {
      return [];
    }
  }
}

export async function findTrackingRecordForMessage(
  userEmail: string,
  messageId?: string,
  subject?: string,
  recipientEmail?: string
): Promise<TrackingRecord | null> {
  const records = await getTrackingRecordsForUser(userEmail);
  if (messageId) {
    const cleanMid = messageId.replace(/[<>]/g, '').trim();
    const found = records.find(
      (r) => r.messageId && r.messageId.replace(/[<>]/g, '').trim() === cleanMid
    );
    if (found) return found;
  }

  // Fallback to matching subject and recipient
  if (subject) {
    const cleanSub = subject.replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
    const found = records.find((r) => {
      const rSub = (r.subject || '').replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
      const matchSub = rSub === cleanSub;
      if (!matchSub) return false;
      if (recipientEmail) {
        return r.recipientEmail.toLowerCase().includes(recipientEmail.toLowerCase());
      }
      return true;
    });
    if (found) return found;
  }

  return null;
}
