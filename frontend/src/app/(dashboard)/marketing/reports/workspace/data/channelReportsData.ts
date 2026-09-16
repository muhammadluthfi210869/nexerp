import { 
  ChannelLeadFunnel, 
  TikTokReportData, 
  YouTubeReportData, 
  WebsiteReportData, 
  MetaAdsReportData, 
  GoogleAdsReportData,
  BrandReport
} from '../types';

// ==========================================
// DREAMLAB (B2B Cosmetic Laboratory & Maklon)
// ==========================================

export const DREAMLAB_LEAD_FUNNELS: ChannelLeadFunnel[] = [
  {
    channel: 'Instagram',
    traffic: 186000,
    prospects: 84,
    nurturingSamples: 28,
    goals: 12,
    conversionRate: 14.3,
    dealValue: 360000000,
    notes: 'Inquiries via Instagram DM & Bio link (Beautypreneurs & clinic owners)'
  },
  {
    channel: 'TikTok',
    traffic: 94000,
    prospects: 148,
    nurturingSamples: 38,
    goals: 14,
    conversionRate: 9.5,
    dealValue: 420000000,
    notes: 'Video edukasi lab & ingredient breakdown viral menarik calon brand owner'
  },
  {
    channel: 'YouTube',
    traffic: 28400,
    prospects: 64,
    nurturingSamples: 21,
    goals: 10,
    conversionRate: 15.6,
    dealValue: 380000000,
    notes: 'Tutorial maklon BPOM & panduan formulasi komprehensif'
  },
  {
    channel: 'Website',
    traffic: 38400,
    prospects: 186,
    nurturingSamples: 62,
    goals: 24,
    conversionRate: 12.9,
    dealValue: 720000000,
    notes: 'Organic search Google Search Console: keyword "maklon skincare bpom"'
  },
  {
    channel: 'Meta Ads',
    traffic: 384000,
    prospects: 312,
    nurturingSamples: 68,
    goals: 36,
    conversionRate: 11.5,
    spend: 10750000,
    cpl: 34455,
    dealValue: 980000000,
    notes: 'Lead Ads & WhatsApp CTA iklan B2B formulasi kosmetik berstandar CPKB'
  },
  {
    channel: 'Google Ads',
    traffic: 89400,
    prospects: 194,
    nurturingSamples: 48,
    goals: 28,
    conversionRate: 14.4,
    spend: 9320000,
    cpl: 48041,
    dealValue: 840000000,
    notes: 'Commercial intent search & Performance Max maklon kosmetik jogja jakarta'
  }
];

export const DREAMLAB_TIKTOK_REPORT: TikTokReportData = {
  followers: 3200,
  followersGained: 460,
  totalViews: 94000,
  avgWatchRetention: 73,
  totalLikes: 4200,
  totalComments: 310,
  totalShares: 680,
  totalSaves: 1420,
  profileVisits: 3850,
  bioLinkClicks: 940,
  leadsContributed: 148,
  sampleRequests: 38,
  topVideos: [
    {
      id: 'tv-dl-1',
      title: 'Kenapa Skincare Murah Bikin Rusak Barrier?',
      hook: '3 Bahan Berbahaya yang Sering Diselipkan di Skincare Abal-Abal',
      views: 48500,
      likes: 2150,
      shares: 420,
      saves: 890,
      retentionRate: 78,
      leadsContributed: 42,
      sampleRequests: 18
    },
    {
      id: 'tv-dl-2',
      title: 'Spill Biaya Asli Maklon 1000 Botol Serum BPOM',
      hook: 'Berapa Sih Modal Asli Bikin Skincare Brand Sendiri?',
      views: 34200,
      likes: 1540,
      shares: 260,
      saves: 530,
      retentionRate: 72,
      leadsContributed: 68,
      sampleRequests: 14
    }
  ]
};

export const DREAMLAB_YOUTUBE_REPORT: YouTubeReportData = {
  subscribers: 1420,
  subsGained: 180,
  totalViews: 28400,
  watchTimeHours: 1240,
  avgViewDuration: '08:45',
  impressions: 112000,
  ctr: 8.4,
  leadsContributed: 64,
  sampleRequests: 21,
  trafficSources: [
    { source: 'YouTube Search', percentage: 48 },
    { source: 'Suggested Videos', percentage: 32 },
    { source: 'Browse Features', percentage: 14 },
    { source: 'External / Social', percentage: 6 }
  ],
  topVideos: [
    {
      id: 'yt-top-1',
      title: 'Masterclass: Tahapan Dari Nol Bikin Brand Skincare BPOM',
      format: 'Video',
      views: 14500,
      watchTimeHours: 680,
      ctr: 9.2,
      leadsContributed: 38,
      sampleRequests: 14
    },
    {
      id: 'yt-top-2',
      title: 'Lab Tour Dreamlab: Mengintip Cleanroom ISO-9001',
      format: 'Video',
      views: 9200,
      watchTimeHours: 390,
      ctr: 7.8,
      leadsContributed: 26,
      sampleRequests: 7
    }
  ]
};

export const DREAMLAB_WEBSITE_REPORT: WebsiteReportData = {
  totalSessions: 38400,
  totalUsers: 29100,
  organicImpressions: 128000,
  organicClicks: 10330,
  avgCtr: 8.07,
  avgPosition: 2.5,
  leadsTraffic: 186,
  sampleRequests: 62,
  conversionRate: 1.8,
  queries: [
    {
      id: 'qm-1',
      queryName: 'jasa maklon skincare bpom',
      impressions: 48200,
      clicks: 4320,
      ctr: 8.96,
      avgPosition: 2.1,
      leadsTraffic: 74,
      sampleRequests: 28,
      landingPage: '/maklon-skincare-bpom'
    },
    {
      id: 'qm-2',
      queryName: 'pabrik maklon kosmetik jogja jakarta',
      impressions: 34100,
      clicks: 2950,
      ctr: 8.65,
      avgPosition: 1.8,
      leadsTraffic: 52,
      sampleRequests: 18,
      landingPage: '/pabrik-kosmetik-cpkb'
    },
    {
      id: 'qm-3',
      queryName: 'cara bikin brand skincare sendiri izin edar',
      impressions: 26500,
      clicks: 1820,
      ctr: 6.87,
      avgPosition: 3.4,
      leadsTraffic: 36,
      sampleRequests: 10,
      landingPage: '/panduan-maklon'
    },
    {
      id: 'qm-4',
      queryName: 'biaya uji lab dermatologically tested',
      impressions: 18900,
      clicks: 1240,
      ctr: 6.56,
      avgPosition: 2.7,
      leadsTraffic: 24,
      sampleRequests: 6,
      landingPage: '/layanan-uji-klinis'
    }
  ],
  tasks: [
    {
      id: 'wt-1',
      title: 'Optimasi Speed LCP Landing Page Formulasi Kosmetik',
      category: 'Technical & Speed',
      assignee: 'Gusti',
      status: 'Completed',
      dueDate: '2026-09-06',
      impact: 'Menurunkan bounce rate form inquiry dari 52% ke 41%'
    },
    {
      id: 'wt-2',
      title: 'Publish Pilar Konten: Panduan CPKB & Sertifikasi Halal Kosmetik',
      category: 'Blog Article',
      assignee: 'Revita',
      status: 'Completed',
      dueDate: '2026-09-10',
      impact: 'Ranking 1 Google untuk query syarat maklon halal'
    },
    {
      id: 'wt-3',
      title: 'Integrasi Form Request Sample Kit Skincare ke WhatsApp CRM',
      category: 'CRO & Sample Form',
      assignee: 'Gusti',
      status: 'In Progress',
      dueDate: '2026-09-18',
      impact: 'Target konversi lead sample naik +25%'
    },
    {
      id: 'wt-4',
      title: 'Optimasi SEO On-Page Title & Schema Markup Lab OEM',
      category: 'SEO Optimization',
      assignee: 'Rahmat',
      status: 'In Progress',
      dueDate: '2026-09-22',
      impact: 'Akurasi snippet Google Search Console naik +35%'
    }
  ]
};

export const DREAMLAB_META_ADS_REPORT: MetaAdsReportData = {
  spend: 10750000,
  impressions: 384000,
  clicks: 12400,
  cpc: 866,
  ctr: 3.23,
  leadsContributed: 312,
  cpl: 34455,
  sampleRequests: 68,
  roas: 9.1,
  creatives: [
    {
      id: 'meta-cr-1',
      creativeName: 'Video R&D: Lab Formulation BTS & Minimum Order 500 pcs',
      hook: 'Bongkar Rahasia Biaya Asli Maklon Skincare Berizin BPOM',
      format: 'Video / Reel',
      visualAngle: 'Behind The Scenes Mesin Cleanroom & Emulsi Lab',
      spend: 4850000,
      impressions: 184000,
      clicks: 6300,
      ctr: 3.42,
      hookRate: 44,
      leadsContributed: 142,
      cpl: 34154,
      sampleRequests: 32,
      status: 'Top Performer',
      actionRecommendation: 'Scale budget +30% pada jam prime time B2B'
    },
    {
      id: 'meta-cr-2',
      creativeName: 'Carousel: Katalog Tekstur Serum, Sunscreen & Barrier Cream',
      hook: 'Coba 5 Sample Formula Gratis Sebelum Produksi Massal',
      format: 'Carousel',
      visualAngle: 'Macro shot swatch tekstur dan daya resap',
      spend: 3450000,
      impressions: 121000,
      clicks: 3450,
      ctr: 2.85,
      hookRate: 36,
      leadsContributed: 98,
      cpl: 35204,
      sampleRequests: 24,
      status: 'Active',
      actionRecommendation: 'Ganti slide ke-3 dengan formula brightening arbutin'
    },
    {
      id: 'meta-cr-3',
      creativeName: 'Single Image: Sertifikasi BPOM & Halal Jaminan Lolos Uji',
      hook: 'Legalitas Skincare Dijamin Tuntas Tanpa Pusing Birokrasi',
      format: 'Single Image',
      visualAngle: 'Sertifikat resmi CPKB & lab testing report',
      spend: 2450000,
      impressions: 79000,
      clicks: 1530,
      ctr: 1.94,
      hookRate: 28,
      leadsContributed: 72,
      cpl: 34027,
      sampleRequests: 12,
      status: 'Testing',
      actionRecommendation: 'A/B test dengan copy headline lebih agresif'
    }
  ]
};

export const DREAMLAB_GOOGLE_ADS_REPORT: GoogleAdsReportData = {
  spend: 9320000,
  impressions: 89400,
  clicks: 6420,
  avgCpc: 1451,
  ctr: 7.18,
  leadsContributed: 194,
  costPerLead: 48041,
  conversionRate: 3.02,
  campaigns: [
    {
      name: 'Search - Jasa Maklon Skincare CPKB & BPOM',
      type: 'Search',
      spend: 5200000,
      impressions: 48000,
      clicks: 3410,
      leads: 115,
      cpl: 45217
    },
    {
      name: 'Performance Max - B2B Sample Formula Kit Formulators',
      type: 'Performance Max',
      spend: 2650000,
      impressions: 28400,
      clicks: 2150,
      leads: 58,
      cpl: 45689
    },
    {
      name: 'Display / Retargeting - Pengunjung Website Maklon 30 Hari',
      type: 'Display / Retargeting',
      spend: 1470000,
      impressions: 13000,
      clicks: 860,
      leads: 21,
      cpl: 70000
    }
  ],
  topQueries: [
    {
      keyword: 'pabrik maklon skincare bpom',
      matchType: 'Exact',
      impressions: 24000,
      clicks: 2100,
      cpc: 1450,
      leadsContributed: 68,
      conversionRate: 3.23,
      cpl: 44779
    },
    {
      keyword: 'jasa maklon kosmetik jogja jakarta',
      matchType: 'Phrase',
      impressions: 18000,
      clicks: 1450,
      cpc: 1380,
      leadsContributed: 47,
      conversionRate: 3.24,
      cpl: 42574
    }
  ]
};

// ==========================================
// TORIBIO (B2C Radiant Skincare Brand)
// ==========================================

export const TORIBIO_LEAD_FUNNELS: ChannelLeadFunnel[] = [
  {
    channel: 'Instagram',
    traffic: 340000,
    prospects: 210,
    nurturingSamples: 65,
    goals: 38,
    conversionRate: 18.1,
    dealValue: 45600000,
    notes: 'Direct checkout via bio link & DM konsultasi skin barrier'
  },
  {
    channel: 'TikTok',
    traffic: 260000,
    prospects: 420,
    nurturingSamples: 110,
    goals: 75,
    conversionRate: 17.8,
    dealValue: 90000000,
    notes: 'TikTok Shop live stream & keranjang kuning produk barrier repair'
  },
  {
    channel: 'YouTube',
    traffic: 20000,
    prospects: 45,
    nurturingSamples: 12,
    goals: 8,
    conversionRate: 17.7,
    dealValue: 9600000,
    notes: 'Review dokter kecantikan & beauty vlogger'
  },
  {
    channel: 'Website',
    traffic: 54000,
    prospects: 310,
    nurturingSamples: 94,
    goals: 62,
    conversionRate: 20.0,
    dealValue: 74400000,
    notes: 'Website store resmi & blog edukasi jerawat/barrier'
  },
  {
    channel: 'Meta Ads',
    traffic: 620000,
    prospects: 680,
    nurturingSamples: 185,
    goals: 142,
    conversionRate: 20.8,
    spend: 18500000,
    cpl: 27205,
    dealValue: 170400000,
    notes: 'Conversion ads bundling serum + moisturizer gratis sample kit'
  },
  {
    channel: 'Google Ads',
    traffic: 95000,
    prospects: 220,
    nurturingSamples: 55,
    goals: 46,
    conversionRate: 20.9,
    spend: 12400000,
    cpl: 56363,
    dealValue: 55200000,
    notes: 'Google Shopping & Search keywords sunscreen barrier repair'
  }
];

export const TORIBIO_TIKTOK_REPORT: TikTokReportData = {
  followers: 21800,
  followersGained: 1680,
  totalViews: 260000,
  avgWatchRetention: 79,
  totalLikes: 18500,
  totalComments: 1240,
  totalShares: 2850,
  totalSaves: 4300,
  profileVisits: 14200,
  bioLinkClicks: 3410,
  leadsContributed: 420,
  sampleRequests: 110,
  topVideos: [
    {
      id: 'tv-tb-1',
      title: '3 Kesalahan Cuci Muka Yang Bikin Barrier Rusak',
      hook: 'Stop Cuci Muka Pakai Air Panas Kalau Gamau Kulit Kering',
      views: 112000,
      likes: 6400,
      shares: 1420,
      saves: 2100,
      retentionRate: 82,
      leadsContributed: 88,
      sampleRequests: 42
    },
    {
      id: 'tv-tb-2',
      title: 'Layering Serum Niacinamide & Ceramide Yang Benar',
      hook: 'Urutan Skincare Malam Buat Skin Barrier Kembali Glowing',
      views: 89000,
      likes: 5100,
      shares: 980,
      saves: 1650,
      retentionRate: 77,
      leadsContributed: 64,
      sampleRequests: 28
    }
  ]
};

export const TORIBIO_YOUTUBE_REPORT: YouTubeReportData = {
  subscribers: 1800,
  subsGained: 90,
  totalViews: 20000,
  watchTimeHours: 850,
  avgViewDuration: '06:12',
  impressions: 74000,
  ctr: 7.6,
  leadsContributed: 45,
  sampleRequests: 12,
  trafficSources: [
    { source: 'YouTube Search', percentage: 42 },
    { source: 'Suggested Videos', percentage: 38 },
    { source: 'Shorts Feed', percentage: 15 },
    { source: 'Channel Pages', percentage: 5 }
  ],
  topVideos: [
    {
      id: 'yt-top-tb-1',
      title: '14 Hari Rutinitas Barrier Repair: Dokter Kulit Breakdown Formula Toribio',
      format: 'Video',
      views: 12500,
      watchTimeHours: 520,
      ctr: 8.2,
      leadsContributed: 28,
      sampleRequests: 8
    },
    {
      id: 'yt-top-tb-2',
      title: 'Shorts: Cara Mengetahui Skin Barrier Kamu Rusak Atau Sehat',
      format: 'Shorts',
      views: 7500,
      watchTimeHours: 140,
      ctr: 6.8,
      leadsContributed: 17,
      sampleRequests: 4
    }
  ]
};

export const TORIBIO_WEBSITE_REPORT: WebsiteReportData = {
  totalSessions: 54000,
  totalUsers: 41200,
  organicImpressions: 178900,
  organicClicks: 16400,
  avgCtr: 9.17,
  avgPosition: 1.9,
  leadsTraffic: 310,
  sampleRequests: 94,
  conversionRate: 2.4,
  queries: [
    {
      id: 'qm-tb-1',
      queryName: 'serum ceramide terbaik kulit sensitif',
      impressions: 62400,
      clicks: 5890,
      ctr: 9.43,
      avgPosition: 1.6,
      leadsTraffic: 124,
      sampleRequests: 45,
      landingPage: '/ceramide-barrier-serum'
    },
    {
      id: 'qm-tb-2',
      queryName: 'sunscreen tanpa whitecast dan pilling',
      impressions: 48900,
      clicks: 4120,
      ctr: 8.42,
      avgPosition: 2.3,
      leadsTraffic: 92,
      sampleRequests: 28,
      landingPage: '/barrier-sunscreen-spf50'
    },
    {
      id: 'qm-tb-3',
      queryName: 'gejala skin barrier rusak parah',
      impressions: 38200,
      clicks: 2980,
      ctr: 7.80,
      avgPosition: 2.9,
      leadsTraffic: 58,
      sampleRequests: 14,
      landingPage: '/edukasi-skin-barrier'
    },
    {
      id: 'qm-tb-4',
      queryName: 'review toribio skin barrier repair',
      impressions: 29400,
      clicks: 3410,
      ctr: 11.59,
      avgPosition: 1.1,
      leadsTraffic: 86,
      sampleRequests: 22,
      landingPage: '/testimoni-klinis'
    }
  ],
  tasks: [
    {
      id: 'wt-tb-1',
      title: 'Optimasi Checkout Flow E-Commerce One-Page Checkout',
      category: 'CRO & Sample Form',
      assignee: 'Gusti',
      status: 'Completed',
      dueDate: '2026-09-04',
      impact: 'Meningkatkan konversi pembelian langsung dari 2.4% ke 3.8%'
    },
    {
      id: 'wt-tb-2',
      title: 'Rilis Fitur Online Skin Barrier Diagnostic Quiz',
      category: 'Landing Page',
      assignee: 'Revita',
      status: 'Completed',
      dueDate: '2026-09-08',
      impact: 'Mengumpulkan 180+ email leads per minggu'
    },
    {
      id: 'wt-tb-3',
      title: 'Speed Index Mobile Optimization Core Web Vitals',
      category: 'Technical & Speed',
      assignee: 'Rahmat',
      status: 'In Progress',
      dueDate: '2026-09-19',
      impact: 'Skor Mobile PageSpeed naik dari 68 ke 92'
    }
  ]
};

export const TORIBIO_META_ADS_REPORT: MetaAdsReportData = {
  spend: 18500000,
  impressions: 620000,
  clicks: 24800,
  cpc: 746,
  ctr: 4.0,
  leadsContributed: 680,
  cpl: 27205,
  sampleRequests: 185,
  roas: 9.2,
  creatives: [
    {
      id: 'cr-tb-1',
      creativeName: 'Reels UGC: Before After Tekstur Kulit 14 Hari Tanpa Filter',
      hook: 'Stop Gonta-Ganti Skincare Sebelum Coba Formula Ini',
      format: 'Video / Reel',
      visualAngle: 'Split screen kamera mikro perbaikan pori & kemerahan',
      spend: 8500000,
      impressions: 310000,
      clicks: 12770,
      ctr: 4.12,
      hookRate: 48,
      leadsContributed: 340,
      cpl: 25000,
      sampleRequests: 95,
      status: 'Top Performer',
      actionRecommendation: 'Gandakan variasi audio trending untuk scale campaign'
    },
    {
      id: 'cr-tb-2',
      creativeName: 'Carousel: Sunscreen Pilling Test Saat Di-blend Makeup',
      hook: 'Sunscreen Kamu Bikin Makeup Longsor dan Menggumpal?',
      format: 'Carousel',
      visualAngle: 'Aplikasi foundation di atas sunscreen barrier shield',
      spend: 5800000,
      impressions: 178000,
      clicks: 5785,
      ctr: 3.25,
      hookRate: 39,
      leadsContributed: 210,
      cpl: 27619,
      sampleRequests: 60,
      status: 'Active',
      actionRecommendation: 'Targeting audience beauty & makeup enthusiasts'
    },
    {
      id: 'cr-tb-3',
      creativeName: 'Single Image: Bundling Promo 9.9 Gratis Travel Cleanser',
      hook: 'Flash Sale Terbatas: Paket Barrier Repair Lengkap Hemat 35%',
      format: 'Single Image',
      visualAngle: 'Foto studio botol kaca minimalis dengan gift pouch eksklusif',
      spend: 4200000,
      impressions: 132000,
      clicks: 2838,
      ctr: 2.15,
      hookRate: 31,
      leadsContributed: 130,
      cpl: 32307,
      sampleRequests: 30,
      status: 'Testing',
      actionRecommendation: 'Review kembali performa saat flash sale 9.9 usai'
    }
  ]
};

export const TORIBIO_GOOGLE_ADS_REPORT: GoogleAdsReportData = {
  spend: 12400000,
  impressions: 95000,
  clicks: 7800,
  avgCpc: 1589,
  ctr: 8.21,
  leadsContributed: 220,
  costPerLead: 56363,
  conversionRate: 2.82,
  campaigns: [
    {
      name: 'Search - Toribio Ceramide Barrier Shield Set',
      type: 'Search',
      spend: 5800000,
      impressions: 42000,
      clicks: 4200,
      leads: 135,
      cpl: 42962
    },
    {
      name: 'Performance Max - Sunscreen Barrier SPF 50 Broad Spectrum',
      type: 'Performance Max',
      spend: 4700000,
      impressions: 38000,
      clicks: 2800,
      leads: 68,
      cpl: 69117
    },
    {
      name: 'Display / Retargeting - Website Visitors 30 Days',
      type: 'Display / Retargeting',
      spend: 1900000,
      impressions: 15000,
      clicks: 800,
      leads: 17,
      cpl: 111764
    }
  ],
  topQueries: [
    {
      keyword: 'serum ceramide kulit sensitif bpom',
      matchType: 'Exact',
      impressions: 32000,
      clicks: 3100,
      cpc: 1480,
      leadsContributed: 88,
      conversionRate: 2.83,
      cpl: 52136
    }
  ]
};

// ==========================================
// ZERO / DATABASE-FIRST EMPTY REPORT MODELS
// ==========================================

export const EMPTY_LEAD_FUNNELS: ChannelLeadFunnel[] = [
  { channel: 'Instagram', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
  { channel: 'TikTok', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
  { channel: 'YouTube', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
  { channel: 'Website', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
  { channel: 'Meta Ads', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
  { channel: 'Google Ads', traffic: 0, prospects: 0, nurturingSamples: 0, goals: 0, conversionRate: 0, dealValue: 0, notes: 'Belum ada inquiry' },
];

export const EMPTY_TIKTOK_REPORT: TikTokReportData = {
  followers: 0,
  followersGained: 0,
  totalViews: 0,
  avgWatchRetention: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
  totalSaves: 0,
  profileVisits: 0,
  bioLinkClicks: 0,
  leadsContributed: 0,
  sampleRequests: 0,
  topVideos: []
};

export const EMPTY_YOUTUBE_REPORT: YouTubeReportData = {
  subscribers: 0,
  subsGained: 0,
  totalViews: 0,
  watchTimeHours: 0,
  avgViewDuration: '0:00',
  impressions: 0,
  ctr: 0,
  leadsContributed: 0,
  sampleRequests: 0,
  trafficSources: [],
  topVideos: []
};

export const EMPTY_WEBSITE_REPORT: WebsiteReportData = {
  totalSessions: 0,
  totalUsers: 0,
  organicImpressions: 0,
  organicClicks: 0,
  avgCtr: 0,
  avgPosition: 0,
  leadsTraffic: 0,
  sampleRequests: 0,
  conversionRate: 0,
  queries: [],
  tasks: []
};

export const EMPTY_META_ADS_REPORT: MetaAdsReportData = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  cpc: 0,
  ctr: 0,
  leadsContributed: 0,
  cpl: 0,
  sampleRequests: 0,
  roas: 0,
  creatives: []
};

export const EMPTY_GOOGLE_ADS_REPORT: GoogleAdsReportData = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  avgCpc: 0,
  ctr: 0,
  leadsContributed: 0,
  costPerLead: 0,
  conversionRate: 0,
  campaigns: [],
  topQueries: []
};

export const createEmptyBrandReport = (brandName: string, period: string): BrandReport => ({
  id: `rep-${brandName.toLowerCase()}-${period.replace(/\s+/g, '-').toLowerCase()}`,
  brandId: brandName,
  monthYear: period,
  totalFollowers: 0,
  followersGained: 0,
  followersUnfollowed: 0,
  followersNetGrowth: 0,
  followersGrowthPercent: 0,
  totalViews: 0,
  averageViewsPerPost: 0,
  totalReach: 0,
  reachGrowthPercent: 0,
  totalImpressions: 0,
  impressionsGrowthPercent: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
  totalSaves: 0,
  totalEngagements: 0,
  engagementRate: 0,
  engagementRateChange: 0,
  storiesRecap: {
    totalStoriesCreated: 0,
    totalStoryViews: 0,
    avgViewsPerStory: 0,
    avgStoriesPerDay: 0,
    completionRate: 0,
    dailyStories: []
  },
  weeklyReports: [],
  leadFunnels: EMPTY_LEAD_FUNNELS,
  tiktokReport: EMPTY_TIKTOK_REPORT,
  youtubeReport: EMPTY_YOUTUBE_REPORT,
  websiteReport: EMPTY_WEBSITE_REPORT,
  metaAdsReport: EMPTY_META_ADS_REPORT,
  googleAdsReport: EMPTY_GOOGLE_ADS_REPORT,
  totalPostsPublished: 0,
  platformBreakdown: [
    { platform: 'Instagram', followers: 0, followersGrowth: 0, reach: 0, views: 0, engagementRate: 0, postsCount: 0 },
    { platform: 'TikTok', followers: 0, followersGrowth: 0, reach: 0, views: 0, engagementRate: 0, postsCount: 0 },
    { platform: 'YouTube', followers: 0, followersGrowth: 0, reach: 0, views: 0, engagementRate: 0, postsCount: 0 },
    { platform: 'Website', followers: 0, followersGrowth: 0, reach: 0, views: 0, engagementRate: 0, postsCount: 0 }
  ],
  weeklyTrends: [],
  formatPerformance: [],
  executiveSummary: `Belum ada data laporan untuk brand ${brandName} pada periode ${period}. Semua metrik tersinkronisasi langsung dari database.`,
  strategicRecommendations: []
});

