import { CRMState, Stage, AutomationFlow, TrafficSourceConfig, BusDevUser, Pipeline } from './types';

export const FIVE_STAGE_FUNNEL: Stage[] = [
  {
    id: 'stage_lead_masuk',
    name: 'LEADS MASUK',
    order: 1,
    color: 'slate',
    description: 'Lead baru masuk dari berbagai saluran. Menjalankan Salesbot Ami Incoming.',
    autoTag: 'Leads Masuk',
    salesbotTrigger: 'Ami Incoming Leads New',
  },
  {
    id: 'stage_cold',
    name: 'COLD',
    order: 2,
    color: 'blue',
    description: 'Prospek baru terdata / outreach awal.',
    autoTag: 'Cold Audience',
  },
  {
    id: 'stage_warm',
    name: 'WARM',
    order: 3,
    color: 'amber',
    description: 'Prospek tertarik aktif, konsultasi MOQ & katalog.',
    autoTag: 'Warm Audience',
  },
  {
    id: 'stage_hot',
    name: 'HOT',
    order: 4,
    color: 'orange',
    description: 'Prospek berkeinginan tinggi, meminta rincian HPP / penawaran.',
    autoTag: 'Hot Leads',
  },
  {
    id: 'stage_sample',
    name: 'SAMPLE',
    order: 5,
    color: 'purple',
    description: 'Tahap pengiriman dan pengujian tester formulasi produk.',
    autoTag: 'Sample',
  },
  {
    id: 'stage_junk_leads',
    name: 'JUNK LEADS',
    order: 6,
    color: 'rose',
    description: 'Pesan spam atau nomor tidak valid.',
    autoTag: 'Junk Leads / Spam',
    isLossStage: true,
  },
  {
    id: 'stage_client_deal',
    name: 'CLIENT DEAL',
    order: 7,
    color: 'emerald',
    description: 'Prospek sepakat deal, TTD SPK & pembayaran DP.',
    autoTag: 'Client Deal',
    isWonStage: true,
  },
  {
    id: 'stage_closed_lost',
    name: 'CLOSED LOST',
    order: 8,
    color: 'slate',
    description: 'Prospek ditutup gagal / tidak memenuhi kualifikasi.',
    autoTag: 'Closed Lost',
    isLossStage: true,
  },
];

export const INITIAL_BUSDEVS: BusDevUser[] = [
  { id: 'user_diaz', name: 'Diaz', status: 'AKTIF', lastAssigned: null, leadCount: 3, avatar: '👨‍💼', phone: '6281277889901', formattedPhone: '+62 812-7788-9901', role: 'Senior BusDev', specialty: 'Maklon Skincare & Serum' },
  { id: 'user_anisa', name: 'Anisa', status: 'AKTIF', lastAssigned: null, leadCount: 3, avatar: '👩‍💼', phone: '6281277889902', formattedPhone: '+62 812-7788-9902', role: 'BusDev Specialist', specialty: 'Maklon Parfum & Bodycare' },
  { id: 'user_budi', name: 'Budi', status: 'AKTIF', lastAssigned: null, leadCount: 2, avatar: '👨‍💻', phone: '6281277889903', formattedPhone: '+62 812-7788-9903', role: 'BusDev Lead', specialty: 'Formulasi Kosmetik Premium' },
  { id: 'user_citra', name: 'Citra', status: 'AKTIF', lastAssigned: null, leadCount: 2, avatar: '👩‍🔬', phone: '6281277889904', formattedPhone: '+62 812-7788-9904', role: 'Consultant', specialty: 'Lisensi BPOM & Halal' },
  { id: 'user_eko', name: 'Eko', status: 'NON-AKTIF', lastAssigned: null, leadCount: 0, avatar: '👨‍💼', phone: '6281277889905', formattedPhone: '+62 812-7788-9905', role: 'BusDev Rep', specialty: 'Maklon Haircare' }
];

export const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: 'pipe_round_robin',
    name: 'Pipeline Utama Round-Robin BusDev',
    roundRobin: true,
    stages: FIVE_STAGE_FUNNEL
  }
];

export const INITIAL_STATE: CRMState = {
  pipelines: INITIAL_PIPELINES,
  busDevs: INITIAL_BUSDEVS,
  leads: [
    {
      id: 'lead_101',
      name: 'CV Herbal Alam Sejahtera',
      leadNumber: '28981912',
      phone: '6281283069717',
      source: 'Meta Ads',
      pipelineId: 'pipe_round_robin',
      stageId: 'stage_hot',
      assignedTo: 'user_diaz',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-28T14:30:00Z',
      tags: ['Meta Ads', 'Hot Leads', 'Maklon Skincare'],
      notes: 'Inquiry maklon serum brightening 5.000 pcs.',
      value: 75000000,
      isAnswered: true
    },
    {
      id: 'lead_102',
      name: 'PT Cantik Nusantara',
      leadNumber: '28981913',
      phone: '6281399887766',
      source: 'Google Ads',
      pipelineId: 'pipe_round_robin',
      stageId: 'stage_sample',
      assignedTo: 'user_anisa',
      createdAt: '2026-08-26T11:20:00Z',
      updatedAt: '2026-08-29T16:00:00Z',
      tags: ['Google Ads', 'Sample Sent', 'Parfum'],
      notes: 'Tester parfum eau de parfum disetujui, kirim sampel fisik.',
      value: 120000000,
      isAnswered: true
    },
    {
      id: 'lead_103',
      name: 'Brand Glow Skincare ID',
      leadNumber: '28981914',
      phone: '6281544332211',
      source: 'Link Tree',
      pipelineId: 'pipe_round_robin',
      stageId: 'stage_client_deal',
      assignedTo: 'user_budi',
      createdAt: '2026-08-20T09:15:00Z',
      updatedAt: '2026-08-30T10:00:00Z',
      tags: ['Link Tree', 'Client Deal', 'DP Paid'],
      notes: 'SPK ditandatangani, DP Rp 50jt diterima.',
      value: 180000000,
      isAnswered: true
    }
  ],
  messages: [
    {
      id: 'msg_1',
      leadId: 'lead_101',
      senderName: 'CV Herbal Alam Sejahtera',
      message: 'Halo ERP Digmar, saya tertarik konsultasi maklon serum brightening untuk brand saya.',
      direction: 'INBOUND',
      channel: 'WHATSAPP_CLIENT',
      timestamp: '2026-08-25T10:00:00Z',
      tags: ['Meta Ads', 'Inquiry']
    },
    {
      id: 'msg_2',
      leadId: 'lead_101',
      senderName: 'Diaz (BusDev)',
      message: 'Halo! Selamat datang di ERP Digmar Maklon. Saya Diaz yang akan mendampingi konsultasi produk Anda. Boleh tahu target MOQ dan range HPP yang diinginkan?',
      direction: 'OUTBOUND',
      channel: 'WHATSAPP_HP',
      timestamp: '2026-08-25T10:02:00Z',
      tags: ['Greeting Sent']
    }
  ],
  broadcasts: [],
  logs: [
    {
      id: 'log_init',
      action: 'system_reset',
      timestamp: new Date().toISOString(),
      params: {},
      resultSummary: 'Engine Omni CRM initialized.',
      structuredOutput: { status: 'READY' }
    }
  ],
  automationFlows: [
    {
      id: 'flow_ami',
      name: 'AMI INCOMING LEADS AUTOMATION',
      active: true,
      triggerEvent: 'INBOUND_MESSAGE',
      conditions: [
        {
          id: 'cond_1',
          nodeIndex: 1,
          keywordMatch: 'maklon',
          targetStageId: 'stage_warm',
          autoTag: 'Maklon Inquiry',
          stopBot: false,
          greetingReply: 'Terima kasih telah menghubungi kami. Tim BusDev kami akan merespons dalam hitungan menit.'
        }
      ]
    }
  ],
  activeFlowId: 'flow_ami',
  trafficSources: [
    { id: 'src_1', name: 'Meta Ads', platform: 'META', autoTag: 'Meta Ads', color: 'blue', active: true },
    { id: 'src_2', name: 'Google Ads', platform: 'GOOGLE', autoTag: 'Google Ads', color: 'amber', active: true },
    { id: 'src_3', name: 'TikTok Ads', platform: 'TIKTOK', autoTag: 'TikTok Ads', color: 'rose', active: true }
  ]
};
