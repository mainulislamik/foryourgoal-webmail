import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDeal, updateDeal, deleteDeal } from '@/lib/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 });
    }

    const deal = await getDeal(id);
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch deal' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await updateDeal(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal: updated });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 });
    }

    const deleted = await deleteDeal(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete deal' }, { status: 500 });
  }
}
