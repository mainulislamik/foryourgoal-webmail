import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface EmailTemplate {
  id: string;
  userEmail: string;
  title: string;
  subject: string;
  bodyHtml: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export function getTemplatesDir(): string {
  try {
    if (fsSync.existsSync('/app/data')) {
      return path.join('/app/data', 'templates');
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), 'data', 'templates');
}

function getUserFilePath(userEmail: string): string {
  const safeName = userEmail.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  return path.join(getTemplatesDir(), `${safeName}.json`);
}

const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'userEmail' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Meeting Follow-up',
    subject: 'Follow-up on our conversation',
    category: 'Follow-up',
    bodyHtml: `<p>Hi {{recipient_name}},</p>
<p>Thank you for taking the time to speak with me today. It was great discussing our upcoming initiatives and potential collaboration.</p>
<p>As discussed, here are the key next steps:</p>
<ul>
  <li>Review the proposal document</li>
  <li>Coordinate on schedule for next week</li>
</ul>
<p>Please let me know if you have any questions in the meantime.</p>
<p>Best regards,<br/>{{sender_name}}</p>`,
  },
  {
    title: 'Quick Touchpoint',
    subject: 'Quick check-in regarding our project',
    category: 'Sales',
    bodyHtml: `<p>Hi {{recipient_name}},</p>
<p>I hope you're having a productive week.</p>
<p>I wanted to quickly check in and see if you had any thoughts or questions regarding our previous discussion.</p>
<p>Looking forward to hearing from you.</p>
<p>Best,<br/>{{sender_name}}</p>`,
  },
  {
    title: 'Thank You & Next Steps',
    subject: 'Thank you for your partnership - Next steps',
    category: 'Partnership',
    bodyHtml: `<p>Dear {{recipient_name}},</p>
<p>Thank you very much for connecting with us on {{date}}. We are excited about moving forward together.</p>
<p>We will prepare the onboarding package and send it over by end of week.</p>
<p>Warm regards,<br/>{{sender_name}}</p>`,
  },
];

export async function getTemplates(userEmail: string): Promise<EmailTemplate[]> {
  const dir = getTemplatesDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = getUserFilePath(userEmail);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const templates = JSON.parse(raw);
    if (Array.isArray(templates)) {
      return templates;
    }
    return [];
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      // Pre-seed default templates for new user
      const now = new Date().toISOString();
      const initial: EmailTemplate[] = DEFAULT_TEMPLATES.map((tmpl, idx) => ({
        ...tmpl,
        id: `tpl_${Date.now()}_${idx}_${crypto.randomBytes(4).toString('hex')}`,
        userEmail: userEmail.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      }));
      await fs.writeFile(filePath, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    console.error('Error reading templates:', e);
    return [];
  }
}

export async function createTemplate(
  userEmail: string,
  data: { title: string; subject: string; bodyHtml: string; category?: string }
): Promise<EmailTemplate> {
  const templates = await getTemplates(userEmail);
  const now = new Date().toISOString();
  const newTemplate: EmailTemplate = {
    id: `tpl_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    userEmail: userEmail.toLowerCase(),
    title: data.title || 'Untitled Template',
    subject: data.subject || '',
    bodyHtml: data.bodyHtml || '',
    category: data.category || 'General',
    createdAt: now,
    updatedAt: now,
  };

  templates.unshift(newTemplate);
  const filePath = getUserFilePath(userEmail);
  await fs.writeFile(filePath, JSON.stringify(templates, null, 2), 'utf-8');
  return newTemplate;
}

export async function updateTemplate(
  userEmail: string,
  id: string,
  data: Partial<Pick<EmailTemplate, 'title' | 'subject' | 'bodyHtml' | 'category'>>
): Promise<EmailTemplate | null> {
  const templates = await getTemplates(userEmail);
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) {
    return null;
  }

  const updated: EmailTemplate = {
    ...templates[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;
  const filePath = getUserFilePath(userEmail);
  await fs.writeFile(filePath, JSON.stringify(templates, null, 2), 'utf-8');
  return updated;
}

export async function deleteTemplate(userEmail: string, id: string): Promise<boolean> {
  const templates = await getTemplates(userEmail);
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) {
    return false;
  }
  const filePath = getUserFilePath(userEmail);
  await fs.writeFile(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
