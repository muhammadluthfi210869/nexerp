import {
  CRMState,
  Lead,
  BusDevUser,
  WhatsAppMessage,
  EngineLog,
  MessageDirection,
  MessageChannel,
  AutomationFlow,
  Pipeline,
} from './types';

let idCounter = 0;
export function generateUniqueId(prefix: string = 'id'): string {
  idCounter += 1;
  const now = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${now}_${idCounter}_${rand}`;
}

export function parseSpintax(template: string): string {
  const spintaxRegex = /\{([^{}]+)\}/g;
  let result = template;
  let matchesFound = true;
  let loopCount = 0;

  while (matchesFound && loopCount < 10) {
    loopCount++;
    const prevResult = result;
    result = result.replace(spintaxRegex, (_, choicesStr) => {
      const choices = choicesStr.split('|');
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex].trim();
    });
    if (result === prevResult) matchesFound = false;
  }
  return result;
}

export function interpolateVariables(template: string, lead: Lead): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, lead.name)
    .replace(/\{\{\s*source\s*\}\}/gi, lead.source)
    .replace(/\{\{\s*phone\s*\}\}/gi, lead.phone)
    .replace(/\{\{\s*id\s*\}\}/gi, lead.id);
}

export function renderBroadcastMessage(template: string, lead: Lead): string {
  const parsed = parseSpintax(template);
  return interpolateVariables(parsed, lead);
}

export interface IntakeGuestbookParams {
  name: string;
  phone: string;
  source: string;
  pipeline_id?: string;
  notes?: string;
  value?: number;
  email?: string;
}

export function intakeGuestbook(state: CRMState, params: IntakeGuestbookParams) {
  const targetPipelineId = params.pipeline_id || state.pipelines[0]?.id || 'pipe_round_robin';
  const pipeline = state.pipelines.find((p) => p.id === targetPipelineId);
  const initialStageId = pipeline?.stages[0]?.id || 'stage_lead_masuk';

  // Round robin assignment if active
  let assignedUser: BusDevUser | null = null;
  const activeBusDevs = state.busDevs.filter((u) => u.status === 'AKTIF');

  if (pipeline?.roundRobin && activeBusDevs.length > 0) {
    // Pick busdev with lowest lead count
    const sorted = [...activeBusDevs].sort((a, b) => a.leadCount - b.leadCount);
    assignedUser = sorted[0];
  }

  const newLead: Lead = {
    id: generateUniqueId('lead'),
    name: params.name,
    phone: params.phone,
    source: params.source,
    pipelineId: targetPipelineId,
    stageId: initialStageId,
    assignedTo: assignedUser ? assignedUser.id : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: params.notes || '',
    value: params.value || 25000000,
    email: params.email || '',
    tags: [params.source, 'Inbound Intake'],
    isAnswered: false,
  };

  const updatedBusDevs = state.busDevs.map((bd) => {
    if (assignedUser && bd.id === assignedUser.id) {
      return {
        ...bd,
        leadCount: bd.leadCount + 1,
        lastAssigned: new Date().toISOString(),
      };
    }
    return bd;
  });

  const welcomeMessage: WhatsAppMessage = {
    id: generateUniqueId('msg'),
    leadId: newLead.id,
    senderName: params.name,
    message: `Halo ERP Digmar, saya ${params.name} ingin bertanya informasi maklon dari ${params.source}.`,
    direction: 'INBOUND',
    channel: 'WHATSAPP_CLIENT',
    timestamp: new Date().toISOString(),
    tags: [params.source],
  };

  const log: EngineLog = {
    id: generateUniqueId('log'),
    action: 'intake_guestbook',
    timestamp: new Date().toISOString(),
    params,
    resultSummary: `Lead "${params.name}" terdaftar & ${
      assignedUser ? `ditugaskan ke ${assignedUser.name}` : 'belum ditugaskan'
    }.`,
    structuredOutput: { leadId: newLead.id, assignedTo: assignedUser?.id },
  };

  return {
    newState: {
      ...state,
      leads: [newLead, ...state.leads],
      messages: [welcomeMessage, ...state.messages],
      busDevs: updatedBusDevs,
      logs: [log, ...state.logs],
    },
    newLead,
    log,
  };
}

export function toggleBusdevStatus(state: CRMState, params: { user_id: string; is_active: boolean }) {
  const updatedBusDevs = state.busDevs.map((bd) => {
    if (bd.id === params.user_id) {
      return { ...bd, status: (params.is_active ? 'AKTIF' : 'NON-AKTIF') as any };
    }
    return bd;
  });

  const user = state.busDevs.find((u) => u.id === params.user_id);
  const log: EngineLog = {
    id: generateUniqueId('log'),
    action: 'toggle_busdev_status',
    timestamp: new Date().toISOString(),
    params,
    resultSummary: `Status BusDev ${user?.name || params.user_id} diubah ke ${
      params.is_active ? 'AKTIF' : 'NON-AKTIF'
    }.`,
    structuredOutput: { userId: params.user_id, status: params.is_active },
  };

  return {
    newState: { ...state, busDevs: updatedBusDevs, logs: [log, ...state.logs] },
    log,
  };
}

export function moveLeadStage(
  state: CRMState,
  params: { lead_id: string; target_pipeline_id: string; target_stage_id: string }
) {
  let targetLead: Lead | null = null;
  const updatedLeads = state.leads.map((l) => {
    if (l.id === params.lead_id) {
      const updated: Lead = {
        ...l,
        pipelineId: params.target_pipeline_id,
        stageId: params.target_stage_id,
        updatedAt: new Date().toISOString(),
      };
      targetLead = updated;
      return updated;
    }
    return l;
  });

  const pipeline = state.pipelines.find((p) => p.id === params.target_pipeline_id);
  const stage = pipeline?.stages.find((s) => s.id === params.target_stage_id);

  const leadName = targetLead ? (targetLead as Lead).name : params.lead_id;

  const log: EngineLog = {
    id: generateUniqueId('log'),
    action: 'move_lead_stage',
    timestamp: new Date().toISOString(),
    params,
    resultSummary: `Lead "${leadName}" dipindahkan ke stage ${
      stage?.name || params.target_stage_id
    }.`,
    structuredOutput: { leadId: params.lead_id, targetStage: params.target_stage_id },
  };

  return {
    newState: { ...state, leads: updatedLeads, logs: [log, ...state.logs] },
    lead: targetLead as Lead | null,
    log,
  };
}

export function syncWhatsappMessage(
  state: CRMState,
  params: { lead_id: string; message: string; direction: MessageDirection; channel: MessageChannel }
) {
  const newMsg: WhatsAppMessage = {
    id: generateUniqueId('msg'),
    leadId: params.lead_id,
    senderName: params.direction === 'OUTBOUND' ? 'BusDev Team' : 'Lead Client',
    message: params.message,
    direction: params.direction,
    channel: params.channel,
    timestamp: new Date().toISOString(),
  };

  const updatedLeads = state.leads.map((l) => {
    if (l.id === params.lead_id) {
      return {
        ...l,
        isAnswered: params.direction === 'OUTBOUND' ? true : false,
        updatedAt: new Date().toISOString(),
      };
    }
    return l;
  });

  const log: EngineLog = {
    id: generateUniqueId('log'),
    action: 'sync_whatsapp_message',
    timestamp: new Date().toISOString(),
    params,
    resultSummary: `WhatsApp message ${params.direction} tersinkronisasi untuk lead ID ${params.lead_id}.`,
    structuredOutput: { msgId: newMsg.id },
  };

  return {
    newState: {
      ...state,
      leads: updatedLeads,
      messages: [newMsg, ...state.messages],
      logs: [log, ...state.logs],
    },
    message: newMsg,
    log,
  };
}

export function togglePipelineRoundRobin(state: CRMState, pipelineId: string) {
  let updatedStatus = false;
  const updatedPipelines = state.pipelines.map((p) => {
    if (p.id === pipelineId) {
      updatedStatus = !p.roundRobin;
      return { ...p, roundRobin: updatedStatus };
    }
    return p;
  });

  const log: EngineLog = {
    id: generateUniqueId('log'),
    action: 'toggle_pipeline_rr',
    timestamp: new Date().toISOString(),
    params: { pipelineId },
    resultSummary: `Round-Robin untuk pipeline ${pipelineId} diubah menjadi ${
      updatedStatus ? 'AKTIF' : 'NON-AKTIF'
    }.`,
    structuredOutput: { pipelineId, roundRobin: updatedStatus },
  };

  return {
    newState: { ...state, pipelines: updatedPipelines, logs: [log, ...state.logs] },
    log,
  };
}
