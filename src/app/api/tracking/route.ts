import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTrackingRecordsForUser } from '@/lib/tracking';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = await getTrackingRecordsForUser(session.email);
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Error fetching tracking records:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch tracking' }, { status: 500 });
  }
}
