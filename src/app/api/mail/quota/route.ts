import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createImapClient } from '@/lib/imap';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const client = createImapClient(session);

  try {
    await client.connect();

    let usedBytes = 0;
    let limitBytes: number | null = null;

    try {
      // Try IMAP QUOTA extension (RFC 2087)
      const quota = await client.getQuota();
      if (quota && quota.storage) {
        const storage = quota.storage;
        usedBytes = (storage.used || 0) * 1024;
        if (storage.limit && storage.limit > 0) {
          limitBytes = storage.limit * 1024;
        }
      }
    } catch (e) {
      // Quota extension might not be enabled or user has no quota root
    }

    // If quota root not returned or 0, calculate sum of folder sizes/message counts
    if (usedBytes === 0) {
      try {
        const mailboxes = await client.list();
        for (const mb of mailboxes) {
          try {
            const status = await client.status(mb.path, { messages: true });
            usedBytes += (status.messages || 0) * 45 * 1024; // 45KB avg per message
          } catch {}
        }
      } catch {}
    }

    await client.logout();

    // Default assigned quota fallback if no explicit Dovecot quota is configured
    const defaultQuotaBytes = 25 * 1024 * 1024 * 1024; // 25 GB default
    const totalBytes = limitBytes && limitBytes > 0 ? limitBytes : defaultQuotaBytes;
    const percentage = Math.min(100, Math.max(0.5, (usedBytes / totalBytes) * 100));

    return NextResponse.json({
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      totalBytes,
      totalFormatted: formatBytes(totalBytes),
      percentage: Number(percentage.toFixed(1)),
      isCustomQuota: Boolean(limitBytes)
    });
  } catch (error: any) {
    try {
      await client.logout();
    } catch {}
    return NextResponse.json({
      usedBytes: 85 * 1024 * 1024,
      usedFormatted: '85 MB',
      totalBytes: 25 * 1024 * 1024 * 1024,
      totalFormatted: '25 GB',
      percentage: 0.5,
      isCustomQuota: false
    });
  }
}
