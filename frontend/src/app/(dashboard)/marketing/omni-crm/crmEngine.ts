import {
  CRMState,
  Lead,
  BusDevUser,
  WhatsAppMessage,
  EngineLog,
  BroadcastExecution,
  BroadcastLogItem,
  MessageDirection,
  MessageChannel,
  AutomationFlow,
  PipelineStage,
} from './types';

let idCounter = 0;
/**
 * Guaranteed unique ID generator combining high-resolution time, random hash, and atomic sequence
 */
export function generateUniqueId(prefix: string = 'id'): string {
  idCounter += 1;
  const now = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const perf = typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) % 100000 : 0;
  return `${prefix}_${now}_${idCounter}_${perf}_${rand}`;
}

/**
 * Spintax Parser: Replaces all {A|B|C} blocks with a random choice
 */
export function parseSpintax(template: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  let result = template;
  let matchesFound = true;

  // Repeat to handle nested or consecutive spintaxes safely
  let loopCount = 0;
  while (matchesFound && loopCount < 10) {
    loopCount++;
    const prevResult = result;
    result = result.replace(spintaxRegex, (_, choicesStr) => {
      const choices = choicesStr.split('|');
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex].trim();
    });
    if (result === prevResult) {
      matchesFound = false;
    }
  }

  return result;
}

/**
 * Interpolates variables such as {{name}}, {{source}}, {{phone}}
 */
export function interpolateVariables(template: string, lead: Lead): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name)
    .replace(/\{\{\s*source\s*\}\}/gi, lead.source)
    .replace(/\{\{\s*phone\s*\}\}/gi, lead.phone)
    .replace(/\{\{\s*id\s*\}\}/gi, lead.id);
}

/**
 * Render complete personalized message with Spintax + Variable interpolation
 */
export function renderBroadcastMessage(template: string, lead: Lead): string {
  const parsed = parseSpintax(template);
  return interpolateVariables(parsed, lead);
}

/**
 * Auto-detects and extracts message tags from text content
 */
export function detectMessageTags(text: string, manualTags: string[] = []): string[] {
  const tagsSet = new Set<string>(manualTags);
  const lower = text.toLowerCase();

  // Junk Leads / Spam detection
  if (
    lower.includes('pinjaman') ||
    lower.includes('pinjol') ||
    lower.includes('dana cepat') ||
    lower.includes('bunga rendah') ||
    lower.includes('slot') ||
    lower.includes('gacor') ||
    lower.includes('maxwin') ||
    lower.includes('deposit pulsa') ||
    lower.includes('jual database') ||
    lower.includes('jasa followers') ||
    lower.includes('investasi dana') ||
    lower.includes('hadiah tunai')
  ) {
    tagsSet.add('Junk Leads / Spam');
  }

  // Source & Ad Tags
  if (
    lower.includes('meta ads') ||
    lower.includes('meta ad') ||
    lower.includes('facebook') ||
    lower.includes('ig ads') ||
    lower.includes('instagram ads') ||
    lower.includes('iklan di meta')
  ) {
    tagsSet.add('Meta Ads');
  }
  if (
    lower.includes('google ads') ||
    lower.includes('goggle ads') ||
    lower.includes('iklan google') ||
    lower.includes('gads') ||
    lower.includes('search ads')
  ) {
    tagsSet.add('Google Ads');
  }
  if (
    (lower.includes('google') || lower.includes('pencarian google') || lower.includes('google search')) &&
    !lower.includes('google ads') &&
    !lower.includes('gads') &&
    !lower.includes('iklan google')
  ) {
    tagsSet.add('Google Organic');
  }
  if (
    lower.includes('linktree') ||
    lower.includes('link tree') ||
    lower.includes('linktr.ee') ||
    lower.includes('bio instagram') ||
    lower.includes('bio tiktok')
  ) {
    tagsSet.add('Link Tree');
  }
  if (
    lower.includes('tiktok') ||
    lower.includes('tt ads') ||
    lower.includes('tiktok ads')
  ) {
    tagsSet.add('TikTok Ads');
  }
  if (
    lower.includes('booth') ||
    lower.includes('buku tamu') ||
    lower.includes('pameran') ||
    lower.includes('expo')
  ) {
    tagsSet.add('Buku Tamu Booth Expo');
  }

  // Product Category & Intent Tags
  if (lower.includes('skincare') || lower.includes('serum') || lower.includes('toner') || lower.includes('cream') || lower.includes('facial')) {
    tagsSet.add('Skincare');
  }
  if (lower.includes('parfum') || lower.includes('perfume') || lower.includes('fragrance') || lower.includes('eau de parfum') || lower.includes('edp')) {
    tagsSet.add('Parfum');
  }
  if (lower.includes('haircare') || lower.includes('shampoo') || lower.includes('hair tonic') || lower.includes('rambut')) {
    tagsSet.add('Haircare');
  }
  if (lower.includes('bodycare') || lower.includes('body lotion') || lower.includes('sabun') || lower.includes('scrub') || lower.includes('body butter')) {
    tagsSet.add('Bodycare');
  }
  if (lower.includes('lip') || lower.includes('lip tint') || lower.includes('lipstick') || lower.includes('lip matte')) {
    tagsSet.add('Lipcare');
  }

  // Intent & Action Tags
  if (
    lower.includes('sample') ||
    lower.includes('tester') ||
    lower.includes('contoh') ||
    lower.includes('trial') ||
    lower.includes('uji coba')
  ) {
    tagsSet.add('Sample Request');
  }
  if (
    lower.includes('harga') ||
    lower.includes('biaya') ||
    lower.includes('pricelist') ||
    lower.includes('price') ||
    lower.includes('tarif') ||
    lower.includes('hpp')
  ) {
    tagsSet.add('Price Inquiry');
  }
  if (
    lower.includes('demo') ||
    lower.includes('zoom') ||
    lower.includes('meeting') ||
    lower.includes('presentasi')
  ) {
    tagsSet.add('Demo Request');
  }

  return Array.from(tagsSet);
}

/**
 * Klaviyo-style Audience Segmentation Filter
 */
export function filterLeadsByKlaviyoSegment(
  leads: Lead[],
  filter: {
    sourceFilter: string;
    stageFilter: string;
    productCategory: string;
    minValue: number;
    interactionRecency: string;
    excludeJunk: boolean;
    busDevId: string;
    tagFilter?: string;
  },
  messages: WhatsAppMessage[] = []
): Lead[] {
  return leads.filter((lead) => {
    // 1. Exclude Junk filter
    if (filter.excludeJunk) {
      if (
        lead.stageId === 'stage_junk_leads' ||
        lead.source === 'Junk Leads' ||
        (lead.tags || []).some((t) => t.toLowerCase().includes('junk') || t.toLowerCase().includes('spam'))
      ) {
        return false;
      }
    }

    // 2. Source Filter
    if (filter.sourceFilter && filter.sourceFilter !== 'ALL') {
      const leadSourceLower = (lead.source || '').toLowerCase();
      const targetSourceLower = filter.sourceFilter.toLowerCase();
      if (!leadSourceLower.includes(targetSourceLower) && !targetSourceLower.includes(leadSourceLower)) {
        // also check tags
        const hasTag = (lead.tags || []).some((t) => t.toLowerCase().includes(targetSourceLower));
        if (!hasTag) return false;
      }
    }

    // 3. Stage Filter
    if (filter.stageFilter && filter.stageFilter !== 'ALL') {
      if (lead.stageId !== filter.stageFilter) {
        return false;
      }
    }

    // 4. Product Category Filter
    if (filter.productCategory && filter.productCategory !== 'ALL') {
      const categoryLower = filter.productCategory.toLowerCase();
      const inTags = (lead.tags || []).some((t) => t.toLowerCase().includes(categoryLower));
      const inNotes = (lead.notes || '').toLowerCase().includes(categoryLower);
      const inName = (lead.name || '').toLowerCase().includes(categoryLower);
      if (!inTags && !inNotes && !inName) return false;
    }

    // 5. Min Value
    if (filter.minValue && filter.minValue > 0) {
      if ((lead.value || 0) < filter.minValue) return false;
    }

    // 6. BusDev Assignment
    if (filter.busDevId && filter.busDevId !== 'ALL') {
      if (lead.assignedTo !== filter.busDevId) return false;
    }

    // 7. Tag Filter
    if (filter.tagFilter && filter.tagFilter.trim() !== '') {
      const tfLower = filter.tagFilter.toLowerCase();
      const hasTag = (lead.tags || []).some((t) => t.toLowerCase().includes(tfLower));
      if (!hasTag) return false;
    }

    // 8. Interaction Recency
    if (filter.interactionRecency && filter.interactionRecency !== 'ALL') {
      const leadMsgs = messages.filter((m) => m.leadId === lead.id);
      const lastMsgDate = leadMsgs.length > 0
        ? new Date(leadMsgs[leadMsgs.length - 1].timestamp).getTime()
        : new Date(lead.updatedAt || lead.createdAt).getTime();
      
      const now = Date.now();
      const diffHours = (now - lastMsgDate) / (1000 * 60 * 60);

      if (filter.interactionRecency === 'LAST_24H' && diffHours > 24) return false;
      if (filter.interactionRecency === 'LAST_3D' && diffHours > 72) return false;
      if (filter.interactionRecency === 'LAST_7D' && diffHours > 168) return false;
      if (filter.interactionRecency === 'INACTIVE_7D_PLUS' && diffHours <= 168) return false;
    }

    return true;
  });
}

/**
 * Get next eligible BusDev according to Round-Robin rules:
 * - Must be AKTIF
 * - Earliest lastAssigned (null comes first, then oldest ISO date string)
 */
export function getNextRoundRobinBusDev(busDevs: BusDevUser[]): BusDevUser | null {
  const activeBusDevs = busDevs.filter((bd) => bd.status === 'AKTIF');
  if (activeBusDevs.length === 0) {
    return null;
  }

  // Sort: null/undefined first, then chronological ascending (oldest first)
  const sorted = [...activeBusDevs].sort((a, b) => {
    if (!a.lastAssigned && !b.lastAssigned) return 0;
    if (!a.lastAssigned) return -1;
    if (!b.lastAssigned) return 1;
    return new Date(a.lastAssigned).getTime() - new Date(b.lastAssigned).getTime();
  });

  return sorted[0];
}

/**
 * CORE FUNCTION 1: intake_guestbook
 * Menambahkan lead baru dari buku tamu dan mengalokasikan ke BusDev via round-robin jika aktif.
 */
export interface IntakeGuestbookParams {
  name: string;
  phone: string;
  source: string;
  pipeline_id?: string;
  notes?: string;
  email?: string;
  value?: number;
}

export function intakeGuestbook(
  state: CRMState,
  params: IntakeGuestbookParams
): { newState: CRMState; log: EngineLog; assignedBusDev: BusDevUser | null; newLead: Lead } {
  const pipelineId = params.pipeline_id || 'pipe_round_robin';
  const targetPipeline =
    (state.pipelines || []).find((p) => p.id === pipelineId) ||
    state.pipelines?.[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [
        {
          id: 'stage_lead_masuk',
          name: 'LEAD MASUK',
          order: 1,
        },
      ],
    };
  const firstStage = (targetPipeline.stages || [])[0] || {
    id: 'stage_lead_masuk',
    name: 'LEAD MASUK',
    order: 1,
  };

  const nowIso = new Date().toISOString();

  // Determine next Lead ID
  const existingNumbers = state.leads
    .map((l) => {
      const match = l.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 100;
    })
    .filter((n) => !isNaN(n));
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
  const newLeadId = `lead_${maxNumber + 1}`;

  let assignedBusDevId: string | null = null;
  let assignedBusDevName = 'Unassigned';
  let nextBusDevObj: BusDevUser | null = null;

  let updatedBusDevs = [...state.busDevs];

  if (targetPipeline.roundRobin) {
    nextBusDevObj = getNextRoundRobinBusDev(state.busDevs);
    if (nextBusDevObj) {
      assignedBusDevId = nextBusDevObj.id;
      assignedBusDevName = nextBusDevObj.name;

      // Update busDev's lastAssigned & leadCount
      updatedBusDevs = updatedBusDevs.map((bd) => {
        if (bd.id === nextBusDevObj!.id) {
          return {
            ...bd,
            lastAssigned: nowIso,
            leadCount: bd.leadCount + 1,
          };
        }
        return bd;
      });
    }
  }

  const extractedTags = detectMessageTags(params.notes || '');
  const initialTags = new Set<string>();
  if (params.source) {
    initialTags.add(params.source);
  }
  if (firstStage.autoTag) {
    initialTags.add(firstStage.autoTag);
  }
  extractedTags.forEach((t) => initialTags.add(t));

  const newLead: Lead = {
    id: newLeadId,
    name: params.name.trim(),
    phone: params.phone.trim().replace(/^0/, '62'),
    source: params.source.trim(),
    pipelineId: targetPipeline.id,
    stageId: firstStage.id,
    assignedTo: assignedBusDevId,
    createdAt: nowIso,
    updatedAt: nowIso,
    tags: Array.from(initialTags),
    notes: params.notes || 'Lead baru dari Buku Tamu.',
    email: params.email || '',
    value: params.value || 0,
  };

  const structuredOutput = {
    status: 'SUCCESS',
    lead_id: newLead.id,
    lead_name: newLead.name,
    pipeline: targetPipeline.name,
    stage: firstStage.name,
    round_robin_active: targetPipeline.roundRobin,
    assigned_to: assignedBusDevId ? `${assignedBusDevName} (${assignedBusDevId})` : 'Unassigned (Round-Robin non-aktif / tidak ada BusDev aktif)',
    timestamp: nowIso,
  };

  const summary = `Lead baru "${newLead.name}" (${newLead.phone}) berhasil masuk ke Pipeline [${targetPipeline.name} -> ${firstStage.name}]. Distribusi: ${
    assignedBusDevId ? `Dialokasikan ke BusDev ${assignedBusDevName} via Round-Robin.` : 'Unassigned.'
  }`;

  const log: EngineLog = {
    id: generateUniqueId('log_intake'),
    action: 'intake_guestbook',
    timestamp: nowIso,
    params,
    resultSummary: summary,
    structuredOutput,
  };

  const newState: CRMState = {
    ...state,
    leads: [newLead, ...state.leads],
    busDevs: updatedBusDevs,
    logs: [log, ...state.logs],
  };

  return {
    newState,
    log,
    assignedBusDev: nextBusDevObj,
    newLead,
  };
}

/**
 * CORE FUNCTION 2: toggle_busdev_status
 * Mengaktifkan atau menonaktifkan BusDev dari antrean Round-Robin.
 */
export interface ToggleBusdevParams {
  user_id: string;
  is_active: boolean;
}

export function toggleBusdevStatus(
  state: CRMState,
  params: ToggleBusdevParams
): { newState: CRMState; log: EngineLog; busDev: BusDevUser | null } {
  const targetUser = state.busDevs.find((u) => u.id === params.user_id);
  const nowIso = new Date().toISOString();

  if (!targetUser) {
    const errorLog: EngineLog = {
      id: generateUniqueId('log_toggle_err'),
      action: 'toggle_busdev_status',
      timestamp: nowIso,
      params,
      resultSummary: `Gagal mengubah status: User ID ${params.user_id} tidak ditemukan.`,
      structuredOutput: {
        status: 'ERROR',
        message: `User ID ${params.user_id} not found in BusDev Pool.`,
      },
    };
    return {
      newState: { ...state, logs: [errorLog, ...state.logs] },
      log: errorLog,
      busDev: null,
    };
  }

  const newStatus = params.is_active ? 'AKTIF' : 'NON-AKTIF';
  const updatedBusDevs = state.busDevs.map((bd) => {
    if (bd.id === params.user_id) {
      return {
        ...bd,
        status: newStatus as 'AKTIF' | 'NON-AKTIF',
      };
    }
    return bd;
  });

  const structuredOutput = {
    status: 'SUCCESS',
    user_id: targetUser.id,
    name: targetUser.name,
    previous_status: targetUser.status,
    new_status: newStatus,
    eligible_for_round_robin: params.is_active,
    timestamp: nowIso,
  };

  const summary = `Status BusDev ${targetUser.name} (${targetUser.id}) berhasil diubah menjadi [${newStatus}]. ${
    params.is_active ? 'Siap menerima lead baru dari antrean Round-Robin.' : 'Dikeluarkan sementara dari rotasi lead (Cuti/Istirahat).'
  }`;

  const log: EngineLog = {
    id: generateUniqueId('log_toggle'),
    action: 'toggle_busdev_status',
    timestamp: nowIso,
    params,
    resultSummary: summary,
    structuredOutput,
  };

  const newState: CRMState = {
    ...state,
    busDevs: updatedBusDevs,
    logs: [log, ...state.logs],
  };

  return {
    newState,
    log,
    busDev: updatedBusDevs.find((bd) => bd.id === params.user_id) || null,
  };
}

/**
 * CORE FUNCTION 3: move_lead_stage
 * Memindahkan lead antar stage atau antar pipeline (Kanban drag-and-drop).
 */
export interface MoveLeadStageParams {
  lead_id: string;
  target_pipeline_id: string;
  target_stage_id: string;
}

export function moveLeadStage(
  state: CRMState,
  params: MoveLeadStageParams
): { newState: CRMState; log: EngineLog; lead: Lead | null } {
  const lead = state.leads.find((l) => l.id === params.lead_id);
  const nowIso = new Date().toISOString();

  if (!lead) {
    const errorLog: EngineLog = {
      id: generateUniqueId('log_move_err'),
      action: 'move_lead_stage',
      timestamp: nowIso,
      params,
      resultSummary: `Gagal memindahkan lead: Lead ID ${params.lead_id} tidak ditemukan.`,
      structuredOutput: {
        status: 'ERROR',
        message: `Lead ${params.lead_id} not found.`,
      },
    };
    return {
      newState: { ...state, logs: [errorLog, ...state.logs] },
      log: errorLog,
      lead: null,
    };
  }

  const pipelinesList = state.pipelines || [];
  const targetPipeline =
    pipelinesList.find((p) => p.id === params.target_pipeline_id) ||
    pipelinesList[0] || {
      id: 'pipe_round_robin',
      name: 'Pipeline Round Robin',
      roundRobin: true,
      stages: [{ id: 'stage_lead_masuk', name: 'LEAD MASUK', order: 1 }],
    };
  const targetStage =
    (targetPipeline.stages || []).find((s) => s.id === params.target_stage_id) ||
    (targetPipeline.stages || [])[0] || {
      id: 'stage_lead_masuk',
      name: 'LEAD MASUK',
      order: 1,
    };

  const prevPipeline =
    pipelinesList.find((p) => p.id === lead.pipelineId)?.name || lead.pipelineId;
  const prevStage =
    pipelinesList.flatMap((p) => p.stages || []).find((s) => s.id === lead.stageId)?.name ||
    lead.stageId;

  const updatedLead: Lead = {
    ...lead,
    pipelineId: targetPipeline.id,
    stageId: targetStage.id,
    updatedAt: nowIso,
  };

  const updatedLeads = state.leads.map((l) => (l.id === params.lead_id ? updatedLead : l));

  const structuredOutput = {
    status: 'SUCCESS',
    lead_id: lead.id,
    lead_name: lead.name,
    from: `${prevPipeline} -> ${prevStage}`,
    to: `${targetPipeline.name} -> ${targetStage.name}`,
    assigned_to: lead.assignedTo,
    timestamp: nowIso,
  };

  const summary = `Lead "${lead.name}" (${lead.id}) berhasil dipindahkan dari [${prevPipeline} -> ${prevStage}] ke [${targetPipeline.name} -> ${targetStage.name}].`;

  const log: EngineLog = {
    id: generateUniqueId('log_move'),
    action: 'move_lead_stage',
    timestamp: nowIso,
    params,
    resultSummary: summary,
    structuredOutput,
  };

  const newState: CRMState = {
    ...state,
    leads: updatedLeads,
    logs: [log, ...state.logs],
  };

  return {
    newState,
    log,
    lead: updatedLead,
  };
}

/**
 * CORE FUNCTION 4: sync_whatsapp_message
 * Mencatat sinkronisasi pesan WhatsApp baik dari HP Sales maupun Web CRM.
 */
export interface SyncWhatsappParams {
  lead_id: string;
  message: string;
  direction: MessageDirection;
  channel: MessageChannel;
  sender_name?: string;
  tags?: string[];
}

export function syncWhatsappMessage(
  state: CRMState,
  params: SyncWhatsappParams
): { newState: CRMState; log: EngineLog; messageObj: WhatsAppMessage | null } {
  const lead = state.leads.find((l) => l.id === params.lead_id);
  const nowIso = new Date().toISOString();

  if (!lead) {
    const errorLog: EngineLog = {
      id: generateUniqueId('log_msg_err'),
      action: 'sync_whatsapp_message',
      timestamp: nowIso,
      params,
      resultSummary: `Gagal sinkronisasi pesan: Lead ID ${params.lead_id} tidak ditemukan.`,
      structuredOutput: {
        status: 'ERROR',
        message: `Lead ${params.lead_id} not found.`,
      },
    };
    return {
      newState: { ...state, logs: [errorLog, ...state.logs] },
      log: errorLog,
      messageObj: null,
    };
  }

  // Auto-detect message tags (e.g. Meta Ads, Google Ads, Sample Request, etc.)
  const detectedTags = detectMessageTags(params.message, params.tags || []);

  // Derive sender name if not explicitly passed
  let sender = params.sender_name;
  if (!sender) {
    if (params.direction === 'INBOUND' || params.channel === 'WHATSAPP_CLIENT') {
      sender = lead.name;
    } else if (params.channel === 'WHATSAPP_HP') {
      const assignedSales = state.busDevs.find((b) => b.id === lead.assignedTo);
      sender = assignedSales ? `${assignedSales.name} (HP Sales)` : 'Sales (HP Mobile)';
    } else {
      sender = 'Admin (Web CRM)';
    }
  }

  const newMsg: WhatsAppMessage = {
    id: generateUniqueId('msg'),
    leadId: lead.id,
    senderName: sender,
    message: params.message.trim(),
    direction: params.direction,
    channel: params.channel,
    timestamp: nowIso,
    tags: detectedTags,
  };

  // If new tags detected, optionally sync tags or source to lead
  let updatedLead = { ...lead };
  let combinedLeadTags = Array.from(new Set([...(lead.tags || []), ...detectedTags]));
  let sourceUpdated = false;

  // Auto update lead source if lead has generic source or matched ad source
  if (detectedTags.includes('Junk Leads / Spam')) {
    updatedLead.source = 'Junk Leads';
    updatedLead.stageId = 'stage_junk_leads';
    sourceUpdated = true;
  } else if (detectedTags.includes('Meta Ads') && lead.source !== 'Meta Ads') {
    updatedLead.source = 'Meta Ads';
    sourceUpdated = true;
  } else if (detectedTags.includes('Google Ads') && lead.source !== 'Google Ads') {
    updatedLead.source = 'Google Ads';
    sourceUpdated = true;
  } else if (detectedTags.includes('Google Organic') && lead.source !== 'Google Organic') {
    updatedLead.source = 'Google Organic';
    sourceUpdated = true;
  } else if (detectedTags.includes('Link Tree') && lead.source !== 'Link Tree') {
    updatedLead.source = 'Link Tree';
    sourceUpdated = true;
  } else if (detectedTags.includes('TikTok Ads') && lead.source !== 'TikTok Ads') {
    updatedLead.source = 'TikTok Ads';
    sourceUpdated = true;
  }

  // AUTOMATIC SALESBOT FLOW EVALUATION FOR INBOUND MESSAGES
  let botReplyMsg: WhatsAppMessage | null = null;
  let autoMoveLog: EngineLog | null = null;

  if (params.direction === 'INBOUND') {
    const activeFlow = (state.automationFlows || []).find((f) => f.id === state.activeFlowId && f.active);
    if (activeFlow && Array.isArray(activeFlow.conditions)) {
      const msgLower = params.message.toLowerCase();
      let matchedCond = activeFlow.conditions.find((c) => {
        if (c.isFallback) return false;
        const kw = (c.keywordMatch || '').toLowerCase();
        // Check exact or partial match of significant keywords
        if (msgLower.includes(kw)) return true;
        // Check Junk/Spam triggers
        if ((kw.includes('pinjaman') || kw.includes('slot') || kw.includes('junk')) && (
          msgLower.includes('pinjaman') || msgLower.includes('pinjol') || msgLower.includes('slot') || msgLower.includes('gacor') || msgLower.includes('jual database') || msgLower.includes('followers')
        )) return true;
        // Split keywords to match key phrases
        if (kw.includes('meta ads') && (msgLower.includes('meta ads') || msgLower.includes('iklan di meta') || msgLower.includes('instagram'))) return true;
        if (kw.includes('google ads') && (msgLower.includes('google ads') || msgLower.includes('dari google ads') || msgLower.includes('iklan google'))) return true;
        if (kw.includes('google') && !kw.includes('google ads') && (msgLower.includes('dari google') || msgLower.includes('google organic') || msgLower.includes('pencarian google'))) return true;
        if (kw.includes('linktree') || (kw.includes('maklon') && (msgLower.includes('konsultasi maklon') || msgLower.includes('linktree') || msgLower.includes('link tree')))) return true;
        if (kw.includes('parfum') && (msgLower.includes('parfum') || msgLower.includes('perfume'))) return true;
        if (kw.includes('haircare') && (msgLower.includes('haircare') || msgLower.includes('shampoo'))) return true;
        return false;
      });

      // If no condition matched, check fallback
      if (!matchedCond) {
        matchedCond = activeFlow.conditions.find((c) => c.isFallback);
      }

      if (matchedCond) {
        const pipes = state.pipelines || [];
        const targetPipeId = matchedCond.targetPipelineId || lead.pipelineId;
        const targetStageId = matchedCond.targetStageId;
        const autoTag = matchedCond.autoTag;

        if (autoTag && !combinedLeadTags.includes(autoTag)) {
          combinedLeadTags = [...combinedLeadTags, autoTag];
          newMsg.tags = Array.from(new Set([...(newMsg.tags || []), autoTag]));
        }

        const prevStage = pipes.flatMap((p) => p.stages || []).find((s) => s.id === updatedLead.stageId)?.name || updatedLead.stageId;
        const nextStageObj = pipes.flatMap((p) => p.stages || []).find((s) => s.id === targetStageId);
        const nextStage = nextStageObj?.name || targetStageId;
        const targetPipeObj = pipes.find((p) => p.id === targetPipeId);

        updatedLead = {
          ...updatedLead,
          pipelineId: targetPipeId,
          stageId: targetStageId,
          tags: combinedLeadTags,
          updatedAt: nowIso,
        };
        newMsg.autoMovedStageTo = nextStage;

        // Auto Greeting Reply from Salesbot if specified
        if (matchedCond.greetingReply) {
          botReplyMsg = {
            id: generateUniqueId('msg_bot'),
            leadId: lead.id,
            senderName: `Salesbot (${activeFlow.name})`,
            message: matchedCond.greetingReply,
            direction: 'OUTBOUND',
            channel: 'CRM_WEB',
            timestamp: new Date(Date.now() + 1000).toISOString(),
            tags: [autoTag || 'Salesbot Auto Reply'].filter(Boolean) as string[],
          };
        }

        autoMoveLog = {
          id: generateUniqueId('log_bot_automove'),
          action: 'salesbot_auto_move',
          timestamp: nowIso,
          params: {
            lead_id: lead.id,
            flow_name: activeFlow.name,
            matched_rule: matchedCond.keywordMatch,
            target_stage: nextStage,
            target_pipeline: targetPipeObj?.name || targetPipeId,
            auto_tag: autoTag,
          },
          resultSummary: `🤖 Salesbot [${activeFlow.name}] mengidentifikasi pesan masuk. Lead otomatis dipindahkan dari [${prevStage}] ke [${nextStage}] di pipeline "${targetPipeObj?.name}" dengan tag [${autoTag}].`,
          structuredOutput: {
            status: 'AUTO_ROUTED',
            from_stage: prevStage,
            to_stage: nextStage,
            auto_tag: autoTag,
            greeting_sent: !!botReplyMsg,
          },
        };
      }
    }
  }

  if (combinedLeadTags.length > 0) {
    updatedLead = {
      ...updatedLead,
      tags: combinedLeadTags,
      updatedAt: nowIso,
    };
  }

  const updatedLeads = state.leads.map((l) => (l.id === lead.id ? updatedLead : l));

  const channelBadge =
    params.channel === 'WHATSAPP_HP'
      ? 'WHATSAPP_HP (Sales Mobile)'
      : params.channel === 'CRM_WEB'
      ? 'CRM_WEB (Dashboard)'
      : 'WHATSAPP_CLIENT (Klien)';

  const structuredOutput = {
    status: 'SUCCESS',
    message_id: newMsg.id,
    lead_id: lead.id,
    lead_name: lead.name,
    direction: params.direction,
    channel: params.channel,
    channel_description: channelBadge,
    tags: detectedTags,
    lead_tags: combinedLeadTags,
    source_auto_updated: sourceUpdated ? updatedLead.source : false,
    sender: sender,
    message_snippet: newMsg.message.length > 50 ? `${newMsg.message.slice(0, 50)}...` : newMsg.message,
    timestamp: nowIso,
  };

  const tagSummary = detectedTags.length > 0 ? ` | Tags terdeteksi: [${detectedTags.join(', ')}]` : '';
  const summary = `Pesan WhatsApp [${params.direction} via ${params.channel}] untuk lead "${lead.name}" berhasil disinkronkan ke riwayat kontak Coexistence${tagSummary}.`;

  const log: EngineLog = {
    id: generateUniqueId('log_msg'),
    action: 'sync_whatsapp_message',
    timestamp: nowIso,
    params: { ...params, detectedTags },
    resultSummary: summary,
    structuredOutput,
  };

  const messagesToAdd = botReplyMsg ? [newMsg, botReplyMsg] : [newMsg];
  const logsToAdd = autoMoveLog ? [autoMoveLog, log] : [log];

  const newState: CRMState = {
    ...state,
    leads: updatedLeads,
    messages: [...state.messages, ...messagesToAdd],
    logs: [...logsToAdd, ...state.logs],
  };

  return {
    newState,
    log: autoMoveLog || log,
    messageObj: newMsg,
  };
}

/**
 * Pipeline Management Functions
 */
export function createCustomPipeline(
  state: CRMState,
  name: string,
  roundRobin: boolean = false,
  customStages?: string[],
  assignedBusDevId?: string
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const id = generateUniqueId('pipe');
  
  let stages: PipelineStage[];
  if (customStages && customStages.length > 0) {
    stages = customStages.map((stageName, idx) => ({
      id: `stage_${id}_${idx + 1}`,
      name: stageName,
      order: idx + 1,
    }));
  } else {
    stages = state.pipelines[0]?.stages || [];
  }

  const newPipeline = {
    id,
    name: name.trim(),
    roundRobin: !!roundRobin,
    assignedBusDevId: assignedBusDevId || undefined,
    stages,
  };

  const log: EngineLog = {
    id: generateUniqueId('log_add_pipe'),
    action: 'move_lead_stage',
    timestamp: nowIso,
    params: { id, name, roundRobin, stageCount: stages.length },
    resultSummary: `Pipeline baru "${newPipeline.name}" berhasil ditambahkan dengan ${stages.length} tahapan workflow standar.`,
    structuredOutput: { status: 'SUCCESS', pipeline_id: id, name: newPipeline.name },
  };

  return {
    newState: {
      ...state,
      pipelines: [...state.pipelines, newPipeline],
      logs: [log, ...state.logs],
    },
    log,
  };
}

export function updatePipelineName(
  state: CRMState,
  pipelineId: string,
  newName: string
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const updatedPipelines = state.pipelines.map((p) =>
    p.id === pipelineId ? { ...p, name: newName.trim() } : p
  );

  const log: EngineLog = {
    id: generateUniqueId('log_ren_pipe'),
    action: 'move_lead_stage',
    timestamp: nowIso,
    params: { pipelineId, newName },
    resultSummary: `Pipeline ID ${pipelineId} berhasil diubah namanya menjadi "${newName.trim()}".`,
    structuredOutput: { status: 'SUCCESS', pipelineId, newName },
  };

  return {
    newState: {
      ...state,
      pipelines: updatedPipelines,
      logs: [log, ...state.logs],
    },
    log,
  };
}

export function saveAutomationFlow(
  state: CRMState,
  flow: AutomationFlow
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const existingIndex = state.automationFlows.findIndex((f) => f.id === flow.id);
  let updatedFlows = [...state.automationFlows];

  if (existingIndex >= 0) {
    updatedFlows[existingIndex] = flow;
  } else {
    updatedFlows.push(flow);
  }

  const log: EngineLog = {
    id: generateUniqueId('log_save_flow'),
    action: 'salesbot_auto_move',
    timestamp: nowIso,
    params: { flowId: flow.id, flowName: flow.name, conditionCount: flow.conditions.length },
    resultSummary: `Flow Otomasi Salesbot "${flow.name}" berhasil diperbarui dengan ${flow.conditions.length} kondisi branching otomatis.`,
    structuredOutput: { status: 'SUCCESS', flow_id: flow.id, flow_name: flow.name },
  };

  return {
    newState: {
      ...state,
      automationFlows: updatedFlows,
      logs: [log, ...state.logs],
    },
    log,
  };
}

/**
 * CORE FUNCTION: tagMessage & tagLead for manual tagging in CRM Backend
 */
export function tagMessage(
  state: CRMState,
  messageId: string,
  newTag: string
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const msg = state.messages.find((m) => m.id === messageId);

  if (!msg) {
    const errLog: EngineLog = {
      id: generateUniqueId('log_tag_err'),
      action: 'sync_whatsapp_message',
      timestamp: nowIso,
      params: { messageId, newTag },
      resultSummary: `Pesan ${messageId} tidak ditemukan untuk diberi tag.`,
      structuredOutput: { status: 'ERROR' },
    };
    return { newState: state, log: errLog };
  }

  const currentTags = msg.tags || [];
  const updatedTags = currentTags.includes(newTag)
    ? currentTags.filter((t) => t !== newTag)
    : [...currentTags, newTag];

  const updatedMessages = state.messages.map((m) =>
    m.id === messageId ? { ...m, tags: updatedTags } : m
  );

  const log: EngineLog = {
    id: generateUniqueId('log_tag'),
    action: 'sync_whatsapp_message',
    timestamp: nowIso,
    params: { messageId, newTag, action: currentTags.includes(newTag) ? 'REMOVE' : 'ADD' },
    resultSummary: `Tag [${newTag}] berhasil ${currentTags.includes(newTag) ? 'dihapus dari' : 'ditambahkan ke'} pesan ID ${messageId}.`,
    structuredOutput: { messageId, tags: updatedTags },
  };

  return {
    newState: {
      ...state,
      messages: updatedMessages,
      logs: [log, ...state.logs],
    },
    log,
  };
}

export function tagLead(
  state: CRMState,
  leadId: string,
  newTag: string
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const lead = state.leads.find((l) => l.id === leadId);

  if (!lead) {
    const errLog: EngineLog = {
      id: generateUniqueId('log_tag_lead_err'),
      action: 'move_lead_stage',
      timestamp: nowIso,
      params: { leadId, newTag },
      resultSummary: `Lead ${leadId} tidak ditemukan untuk diberi tag.`,
      structuredOutput: { status: 'ERROR' },
    };
    return { newState: state, log: errLog };
  }

  const currentTags = lead.tags || [];
  const updatedTags = currentTags.includes(newTag)
    ? currentTags.filter((t) => t !== newTag)
    : [...currentTags, newTag];

  const updatedLeads = state.leads.map((l) =>
    l.id === leadId ? { ...l, tags: updatedTags, updatedAt: nowIso } : l
  );

  const log: EngineLog = {
    id: generateUniqueId('log_tag_lead'),
    action: 'move_lead_stage',
    timestamp: nowIso,
    params: { leadId, newTag, action: currentTags.includes(newTag) ? 'REMOVE' : 'ADD' },
    resultSummary: `Tag [${newTag}] berhasil ${currentTags.includes(newTag) ? 'dihapus dari' : 'ditambahkan ke'} Lead ${lead.name}.`,
    structuredOutput: { leadId, tags: updatedTags },
  };

  return {
    newState: {
      ...state,
      leads: updatedLeads,
      logs: [log, ...state.logs],
    },
    log,
  };
}

/**
 * CORE FUNCTION 5: execute_broadcast
 * Menjalankan broadcast pesan ke daftar lead yang terfilter dengan Spintax dan safe delay.
 */
export interface ExecuteBroadcastParams {
  source_filter: string;
  template_text: string;
  pipeline_id?: string;
  stage_id?: string;
}

export function prepareBroadcastRecipients(
  state: CRMState,
  params: ExecuteBroadcastParams
): { targetLeads: Lead[]; previewItems: BroadcastLogItem[] } {
  const targetLeads = state.leads.filter((lead) => {
    // Filter by source if specified and not 'ALL'
    if (params.source_filter && params.source_filter !== 'ALL') {
      if (!lead.source.toLowerCase().includes(params.source_filter.toLowerCase())) {
        return false;
      }
    }
    // Filter by pipeline if specified
    if (params.pipeline_id && lead.pipelineId !== params.pipeline_id) {
      return false;
    }
    // Filter by stage if specified
    if (params.stage_id && lead.stageId !== params.stage_id) {
      return false;
    }
    return true;
  });

  const previewItems: BroadcastLogItem[] = targetLeads.map((lead) => {
    const rendered = renderBroadcastMessage(params.template_text, lead);
    // Safe delay between 8 to 15 seconds random
    const delay = Math.floor(Math.random() * (15 - 8 + 1)) + 8;
    return {
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      renderedMessage: rendered,
      delaySeconds: delay,
      status: 'QUEUED',
    };
  });

  return { targetLeads, previewItems };
}

export function executeBroadcastInstant(
  state: CRMState,
  params: ExecuteBroadcastParams
): { newState: CRMState; log: EngineLog; execution: BroadcastExecution } {
  const { targetLeads, previewItems } = prepareBroadcastRecipients(state, params);
  const nowIso = new Date().toISOString();
  const broadcastId = generateUniqueId('bcast');

  const processedItems: BroadcastLogItem[] = previewItems.map((item) => ({
    ...item,
    status: 'SENT',
    sentAt: new Date().toISOString(),
  }));

  const execution: BroadcastExecution = {
    id: broadcastId,
    sourceFilter: params.source_filter,
    templateText: params.template_text,
    totalRecipients: processedItems.length,
    successfulSends: processedItems.length,
    failedSends: 0,
    items: processedItems,
    startedAt: nowIso,
    completedAt: new Date().toISOString(),
    status: 'COMPLETED',
  };

  // Also record outgoing WhatsApp messages for each lead
  const newMessages: WhatsAppMessage[] = processedItems.map((item) => ({
    id: generateUniqueId(`msg_bcast_${item.leadId}`),
    leadId: item.leadId,
    senderName: 'Broadcast Engine (Web CRM)',
    message: item.renderedMessage,
    direction: 'OUTBOUND',
    channel: 'CRM_WEB',
    timestamp: nowIso,
  }));

  const structuredOutput = {
    status: 'SUCCESS',
    broadcast_id: broadcastId,
    filter_applied: params.source_filter,
    total_recipients: targetLeads.length,
    spintax_samples: processedItems.slice(0, 3).map((it) => ({
      to: `${it.leadName} (${it.phone})`,
      message: it.renderedMessage,
      simulated_delay: `${it.delaySeconds}s`,
    })),
    anti_ban_protection: 'ACTIVE (Random safe delay 8-15s per phone + Spintax permutation)',
    timestamp: nowIso,
  };

  const summary = `Broadcast selesai! ${targetLeads.length} pesan dengan Spintax unik telah dikirim ke target filter "${params.source_filter}". Anti-ban safe delay (8-15s) disimulasikan.`;

  const log: EngineLog = {
    id: generateUniqueId('log_bcast'),
    action: 'execute_broadcast',
    timestamp: nowIso,
    params,
    resultSummary: summary,
    structuredOutput,
  };

  const newState: CRMState = {
    ...state,
    messages: [...state.messages, ...newMessages],
    broadcasts: [execution, ...state.broadcasts],
    logs: [log, ...state.logs],
  };

  return {
    newState,
    log,
    execution,
  };
}

/**
 * Toggle Round-Robin for a pipeline
 */
export function togglePipelineRoundRobin(
  state: CRMState,
  pipelineId: string
): { newState: CRMState; log: EngineLog } {
  const nowIso = new Date().toISOString();
  const pipeline = state.pipelines.find((p) => p.id === pipelineId);

  if (!pipeline) {
    return {
      newState: state,
      log: {
        id: generateUniqueId('log_err'),
        action: 'toggle_pipeline_rr',
        timestamp: nowIso,
        params: { pipelineId },
        resultSummary: `Pipeline ${pipelineId} tidak ditemukan.`,
        structuredOutput: { status: 'ERROR' },
      },
    };
  }

  const updatedPipelines = state.pipelines.map((p) => {
    if (p.id === pipelineId) {
      return { ...p, roundRobin: !p.roundRobin };
    }
    return p;
  });

  const targetPipe = updatedPipelines.find((p) => p.id === pipelineId)!;
  const statusStr = targetPipe.roundRobin ? 'AKTIF' : 'NON-AKTIF';

  const log: EngineLog = {
    id: generateUniqueId('log_pipe_rr'),
    action: 'toggle_pipeline_rr',
    timestamp: nowIso,
    params: { pipelineId, newRoundRobin: targetPipe.roundRobin },
    resultSummary: `Round-Robin untuk Pipeline "${targetPipe.name}" diubah menjadi [${statusStr}].`,
    structuredOutput: {
      status: 'SUCCESS',
      pipeline_id: targetPipe.id,
      pipeline_name: targetPipe.name,
      round_robin: statusStr,
      timestamp: nowIso,
    },
  };

  return {
    newState: {
      ...state,
      pipelines: updatedPipelines,
      logs: [log, ...state.logs],
    },
    log,
  };
}

/**
 * Add or update a Traffic Source configuration
 */
export function addTrafficSource(
  state: CRMState,
  params: {
    name: string;
    platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'WHATSAPP' | 'OFFLINE' | 'WEBSITE' | 'REFERRAL' | 'OTHER';
    utmSource?: string;
    autoTag?: string;
    color?: string;
    icon?: string;
  }
): CRMState {
  const currentSources = state.trafficSources || [];
  const existingIdx = currentSources.findIndex(
    (s) => s.name.toLowerCase() === params.name.trim().toLowerCase()
  );

  let updatedSources = [...currentSources];
  if (existingIdx >= 0) {
    updatedSources[existingIdx] = {
      ...updatedSources[existingIdx],
      ...params,
      name: params.name.trim(),
    };
  } else {
    updatedSources.push({
      id: generateUniqueId('src'),
      name: params.name.trim(),
      platform: params.platform,
      utmSource: params.utmSource || params.name.toLowerCase().replace(/\s+/g, '_'),
      autoTag: params.autoTag || params.name.trim(),
      leadCount: 0,
      totalValue: 0,
      color: params.color || 'indigo',
      icon: params.icon || '🏷️',
      active: true,
    });
  }

  return {
    ...state,
    trafficSources: updatedSources,
  };
}

/**
 * Delete a traffic source
 */
export function deleteTrafficSource(state: CRMState, sourceId: string): CRMState {
  return {
    ...state,
    trafficSources: (state.trafficSources || []).filter((s) => s.id !== sourceId),
  };
}

