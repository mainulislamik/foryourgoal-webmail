import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateTemplate, deleteTemplate } from '@/lib/templates';

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
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, subject, bodyHtml, category } = body;

    const updated = await updateTemplate(session.email, id, {
      title,
      subject,
      bodyHtml,
      category,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update template' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }

    const deleted = await deleteTemplate(session.email, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete template' }, { status: 500 });
  }
}
