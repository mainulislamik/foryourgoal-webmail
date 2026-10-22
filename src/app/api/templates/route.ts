import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTemplates, createTemplate } from '@/lib/templates';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await getTemplates(session.email);
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, subject, bodyHtml, category } = body;

    if (!title) {
      return NextResponse.json({ error: 'Template title is required' }, { status: 400 });
    }

    const template = await createTemplate(session.email, {
      title,
      subject: subject || '',
      bodyHtml: bodyHtml || '',
      category: category || 'General',
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create template' }, { status: 500 });
  }
}
