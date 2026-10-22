import { NextRequest, NextResponse } from 'next/server';
import { recordOpenEvent } from '@/lib/tracking';

const TRANSPARENT_1PX_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (id) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // Asynchronously record open event without blocking
      recordOpenEvent(id, { ip, userAgent }).catch((err) => {
        console.error('Error logging open event:', err);
      });
    }
  } catch (err) {
    console.error('Error in tracking open route:', err);
  }

  return new NextResponse(TRANSPARENT_1PX_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
