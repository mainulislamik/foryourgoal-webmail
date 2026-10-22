import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  findDealForMessage,
} from '@/lib/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId') || undefined;
    const messageId = searchParams.get('messageId') || undefined;
    const contactEmail = searchParams.get('contactEmail') || undefined;
    const subject = searchParams.get('subject') || undefined;

    if (messageId || contactEmail || subject) {
      const match = await findDealForMessage(messageId, contactEmail, subject);
      return NextResponse.json({ deal: match });
    }

    const deals = await getDeals(pipelineId);
    return NextResponse.json({ deals });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      pipelineId,
      stageId,
      contactEmail,
      contactName,
      dealValue,
      notes,
      tasks,
      messageId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Deal title is required' }, { status: 400 });
    }
    if (!contactEmail) {
      return NextResponse.json({ error: 'Contact email is required' }, { status: 400 });
    }

    const deal = await createDeal({
      title,
      pipelineId,
      stageId,
      contactEmail,
      contactName,
      dealValue: typeof dealValue === 'number' ? dealValue : Number(dealValue) || 0,
      notes,
      tasks,
      messageId,
    });

    return NextResponse.json({ success: true, deal });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create deal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Deal id is required' }, { status: 400 });
    }

    const updated = await updateDeal(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal: updated });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Deal id is required' }, { status: 400 });
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
