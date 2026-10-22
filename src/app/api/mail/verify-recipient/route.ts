import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const OWN_DOMAIN = 'foryourgoal.com';

// Directory accounts known for foryourgoal.com
const KNOWN_FYG_ACCOUNTS = new Set([
  'support@foryourgoal.com',
  'team@foryourgoal.com',
  'admin@foryourgoal.com',
  'billing@foryourgoal.com',
  'info@foryourgoal.com',
  'imon@foryourgoal.com',
  'noreply@foryourgoal.com',
  'mail@foryourgoal.com',
  'contact@foryourgoal.com',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Recipient address required' }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();

    // 1. Strict syntax check
    if (!EMAIL_REGEX.test(trimmed)) {
      return NextResponse.json({
        valid: false,
        reason: 'Invalid email address syntax',
        email: trimmed,
      });
    }

    const [, domain] = trimmed.split('@');

    if (!domain) {
      return NextResponse.json({
        valid: false,
        reason: 'Missing domain in email address',
        email: trimmed,
      });
    }

    // 2. Own domain verification
    if (domain === OWN_DOMAIN) {
      // If it's a known account or standard user on foryourgoal.com, it is valid
      return NextResponse.json({
        valid: true,
        domain,
        isInternal: true,
        email: trimmed,
      });
    }

    // 3. External domain MX verification
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return NextResponse.json({
          valid: true,
          domain,
          isInternal: false,
          mxExchange: mxRecords[0].exchange,
          email: trimmed,
        });
      }
    } catch (dnsErr: any) {
      // If MX record not found, try fallback A record check (RFC 5321)
      if (dnsErr.code === 'ENODATA' || dnsErr.code === 'ENOTFOUND') {
        try {
          const aRecords = await dns.resolve4(domain);
          if (aRecords && aRecords.length > 0) {
            return NextResponse.json({
              valid: true,
              domain,
              isInternal: false,
              email: trimmed,
            });
          }
        } catch {
          // Fall through to invalid domain
        }
      }

      return NextResponse.json({
        valid: false,
        reason: `Domain "${domain}" does not exist or has no mail server`,
        code: dnsErr.code,
        domain,
        email: trimmed,
      });
    }

    return NextResponse.json({
      valid: false,
      reason: `No mail server found for domain "${domain}"`,
      domain,
      email: trimmed,
    });
  } catch (error: any) {
    console.error('Verify recipient error:', error);
    return NextResponse.json(
      { valid: false, reason: 'Failed to verify recipient' },
      { status: 500 }
    );
  }
}
