import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Stage {
  id: string;
  name: string;
  color: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
  createdAt: string;
}

export interface DealNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface DealTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Deal {
  id: string;
  title: string;
  pipelineId: string;
  stageId: string;
  contactEmail: string;
  contactName?: string;
  dealValue?: number;
  notes: DealNote[];
  tasks: DealTask[];
  messageIds: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'lead', name: 'Lead', color: '#64748b' },
  { id: 'contacted', name: 'Contacted', color: '#0284c7' },
  { id: 'meeting', name: 'Meeting', color: '#8b5cf6' },
  { id: 'proposal', name: 'Proposal', color: '#f97316' },
  { id: 'won', name: 'Won', color: '#16a34a' },
  { id: 'lost', name: 'Lost', color: '#ef4444' },
];

export function getCrmDir(): string {
  try {
    if (fsSync.existsSync('/app/data')) {
      return path.join('/app/data', 'crm');
    }
  } catch {
    // fallback
  }
  return path.join(process.cwd(), 'data', 'crm');
}

function getPipelinesFile(): string {
  return path.join(getCrmDir(), 'pipelines.json');
}

function getDealsFile(): string {
  return path.join(getCrmDir(), 'deals.json');
}

async function ensureCrmInitialized(): Promise<void> {
  const dir = getCrmDir();
  await fs.mkdir(dir, { recursive: true });

  const pipelinesPath = getPipelinesFile();
  try {
    await fs.access(pipelinesPath);
  } catch {
    // Seed initial default pipeline
    const defaultPipeline: Pipeline = {
      id: 'pipeline_sales_leads',
      name: 'Sales Leads',
      stages: DEFAULT_STAGES,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(pipelinesPath, JSON.stringify([defaultPipeline], null, 2), 'utf-8');
  }

  const dealsPath = getDealsFile();
  try {
    await fs.access(dealsPath);
  } catch {
    await fs.writeFile(dealsPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getPipelines(): Promise<Pipeline[]> {
  await ensureCrmInitialized();
  try {
    const raw = await fs.readFile(getPipelinesFile(), 'utf-8');
    const pipelines = JSON.parse(raw);
    return Array.isArray(pipelines) ? pipelines : [];
  } catch {
    return [];
  }
}

export async function createPipeline(
  name: string,
  stages: Stage[] = DEFAULT_STAGES
): Promise<Pipeline> {
  await ensureCrmInitialized();
  const pipelines = await getPipelines();
  const newPipeline: Pipeline = {
    id: 'pipe_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    name: name.trim(),
    stages: stages.length > 0 ? stages : DEFAULT_STAGES,
    createdAt: new Date().toISOString(),
  };
  pipelines.push(newPipeline);
  await fs.writeFile(getPipelinesFile(), JSON.stringify(pipelines, null, 2), 'utf-8');
  return newPipeline;
}

export async function getDeals(pipelineId?: string): Promise<Deal[]> {
  await ensureCrmInitialized();
  try {
    const raw = await fs.readFile(getDealsFile(), 'utf-8');
    const deals: Deal[] = JSON.parse(raw);
    if (!Array.isArray(deals)) return [];
    if (pipelineId) {
      return deals.filter((d) => d.pipelineId === pipelineId);
    }
    return deals;
  } catch {
    return [];
  }
}

export async function getDeal(id: string): Promise<Deal | null> {
  const deals = await getDeals();
  return deals.find((d) => d.id === id) || null;
}

export async function findDealForMessage(
  messageId?: string,
  contactEmail?: string,
  subject?: string
): Promise<Deal | null> {
  const deals = await getDeals();
  if (messageId) {
    const cleanMid = messageId.replace(/[<>]/g, '').trim();
    const found = deals.find((d) =>
      d.messageIds && d.messageIds.some((m) => m.replace(/[<>]/g, '').trim() === cleanMid)
    );
    if (found) return found;
  }

  if (contactEmail) {
    const cleanEmail = contactEmail.toLowerCase().trim();
    const found = deals.find((d) => d.contactEmail && d.contactEmail.toLowerCase().trim() === cleanEmail);
    if (found) return found;
  }

  if (subject) {
    const cleanSub = subject.replace(/^(re|fwd|fw):\s*/i, '').trim().toLowerCase();
    const found = deals.find((d) => d.title && d.title.toLowerCase().includes(cleanSub));
    if (found) return found;
  }

  return null;
}

export async function createDeal(data: {
  title: string;
  pipelineId?: string;
  stageId?: string;
  contactEmail: string;
  contactName?: string;
  dealValue?: number;
  notes?: DealNote[];
  tasks?: DealTask[];
  messageId?: string;
}): Promise<Deal> {
  await ensureCrmInitialized();
  const pipelines = await getPipelines();
  const defaultPipeline = pipelines[0] || {
    id: 'pipeline_sales_leads',
    stages: DEFAULT_STAGES,
  };

  const chosenPipelineId = data.pipelineId || defaultPipeline.id;
  const targetPipeline = pipelines.find((p) => p.id === chosenPipelineId) || defaultPipeline;
  const chosenStageId = data.stageId || targetPipeline.stages[0]?.id || 'lead';

  const deals = await getDeals();
  const now = new Date().toISOString();
  const newDeal: Deal = {
    id: 'deal_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    title: data.title.trim(),
    pipelineId: chosenPipelineId,
    stageId: chosenStageId,
    contactEmail: data.contactEmail.trim(),
    contactName: data.contactName?.trim() || data.contactEmail.split('@')[0],
    dealValue: typeof data.dealValue === 'number' ? data.dealValue : 0,
    notes: Array.isArray(data.notes) ? data.notes : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    messageIds: data.messageId ? [data.messageId.replace(/[<>]/g, '').trim()] : [],
    createdAt: now,
    updatedAt: now,
  };

  deals.unshift(newDeal);
  await fs.writeFile(getDealsFile(), JSON.stringify(deals, null, 2), 'utf-8');
  return newDeal;
}

export async function updateDeal(
  id: string,
  updates: Partial<Omit<Deal, 'id' | 'createdAt'>> & { addMessageId?: string }
): Promise<Deal | null> {
  await ensureCrmInitialized();
  const deals = await getDeals();
  const index = deals.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const current = deals[index];
  const now = new Date().toISOString();

  let messageIds = current.messageIds || [];
  if (updates.addMessageId) {
    const cleanMid = updates.addMessageId.replace(/[<>]/g, '').trim();
    if (!messageIds.includes(cleanMid)) {
      messageIds = [...messageIds, cleanMid];
    }
  }

  const updated: Deal = {
    ...current,
    title: updates.title !== undefined ? updates.title : current.title,
    pipelineId: updates.pipelineId !== undefined ? updates.pipelineId : current.pipelineId,
    stageId: updates.stageId !== undefined ? updates.stageId : current.stageId,
    contactEmail: updates.contactEmail !== undefined ? updates.contactEmail : current.contactEmail,
    contactName: updates.contactName !== undefined ? updates.contactName : current.contactName,
    dealValue: updates.dealValue !== undefined ? updates.dealValue : current.dealValue,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
    tasks: updates.tasks !== undefined ? updates.tasks : current.tasks,
    messageIds: updates.messageIds !== undefined ? updates.messageIds : messageIds,
    updatedAt: now,
  };

  deals[index] = updated;
  await fs.writeFile(getDealsFile(), JSON.stringify(deals, null, 2), 'utf-8');
  return updated;
}

export async function deleteDeal(id: string): Promise<boolean> {
  await ensureCrmInitialized();
  const deals = await getDeals();
  const filtered = deals.filter((d) => d.id !== id);
  if (filtered.length === deals.length) return false;
  await fs.writeFile(getDealsFile(), JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
