import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPipelines, createPipeline } from '@/lib/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pipelines = await getPipelines();
    return NextResponse.json({ pipelines });
  } catch (error: any) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch pipelines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, stages } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400 });
    }

    const pipeline = await createPipeline(name, stages);
    return NextResponse.json({ success: true, pipeline });
  } catch (error: any) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create pipeline' }, { status: 500 });
  }
}
