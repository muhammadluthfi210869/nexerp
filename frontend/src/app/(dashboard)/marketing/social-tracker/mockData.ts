import { PostItem, MetaAccountConfig, MetaInsightsSummary, MetaDailyTrend, DemographicData, BestTimeSlot, CampaignOKR } from './types';

export const initialMetaAccount: MetaAccountConfig = {
  accessToken: 'EAAQ...meta_bus_suite_tok_sample',
  pageId: '109283746592019',
  pageName: 'BrandStudio ERP Marketing',
  igAccountId: '17841405829103948',
  igUsername: '@brandstudio.erp',
  profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  isConnected: true,
  isLiveApi: false,
  tokenExpiresAt: '2026-12-31T23:59:59Z',
  permissions: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'business_management'
  ],
  followersCount: 38450,
  igFollowersCount: 62800,
};

export const initialPosts: PostItem[] = [
  {
    id: 'post-1',
    title: '5 Rahasia Hook Reels Instagram yang Bikin Audiens Nonton Sampai Habis 🚀',
    platform: 'instagram',
    contentType: 'reel',
    status: 'published',
    scheduledDate: '2026-08-25T19:30',
    publishedDate: '2026-08-25T19:30',
    pillar: 'Educational',
    caption: `Stop bikin Reels yang di-skip di detik ke-2! 😱\n\nBanyak creator bingung kenapa reach Reels-nya mentok di 200 views. Padahal kuncinya ada di "The First 3-Seconds Rule".\n\nBerikut 5 formula hook yang selalu berhasil di Meta Business Suite kami:\n1️⃣ Anti-Intuitive Statement ("Jangan posting jam 12 siang kalau mau...")\n2️⃣ Pattern Interrupt (Transisi visual cepat / zoom in)\n3️⃣ Call Out Specific Target ("Khusus buat kamu yang bisnis online...")\n4️⃣ Fear of Missing Out ("Update algoritma Meta terbaru yang belum banyak orang tahu")\n5️⃣ Direct Benefit Hook ("Cara dapat 10K reach pertama tanpa ads")\n\nSimpan postingan ini biar ga lupa saat produksi konten besok! 💾 Tag teman bisnismu di kolom komentar ya! 👇`,
    hooks: [
      'Stop bikin Reels yang di-skip di detik ke-2!',
      'Alasan kenapa views Reels kamu ga pernah tembus 1K!',
      'Gunakan 5 hook ini sebelum upload konten berikutnya!'
    ],
    cta: 'Save postingan ini dan drop komen "MAU" buat dapetin template hook gratis!',
    hashtags: ['#InstagramTips', '#SocialMediaPlanning', '#ContentCreatorID', '#MetaBusinessSuite', '#TipsReels', '#DigitalMarketingIndonesia'],
    coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    metaPostId: 'meta_ig_17982049182309',
    metaPermalink: 'https://instagram.com/p/C_sample01',
    notes: 'Kamera: 4K 60fps, Color Grading Warm Tone, Voiceover energetic.',
    checklist: [
      { id: 'c1', text: 'Riset 3 hook alternatif', done: true },
      { id: 'c2', text: 'Shooting video A-roll & B-roll', done: true },
      { id: 'c3', text: 'Edit subtitle dinamis di CapCut', done: true },
      { id: 'c4', text: 'Buat cover Reels beresolusi tinggi', done: true },
      { id: 'c5', text: 'Jadwalkan via Meta Business Suite', done: true }
    ],
    calloutText: 'Top Performer Minggu Ini: Virality score mencapai 94/100 karena share rate tinggi di DM Instagram!',
    calloutEmoji: '🔥',
    targetAudience: 'Content Creators, Social Media Managers & UMKM',
    campaign: 'Q3 Brand Awareness Sprint',
    performance: {
      reach: 58400,
      impressions: 74200,
      likes: 4890,
      comments: 342,
      shares: 1280,
      saves: 2150,
      videoViews: 63800,
      clicks: 410,
      engagementRate: 9.8,
      viralityScore: 94
    },
    createdAt: '2026-08-20T10:00',
    updatedAt: '2026-08-26T08:30'
  },
  {
    id: 'post-2',
    title: 'Carousel Panduan Lengkap Meta Ads 2026: Strategi Budget Minim Hasil Maksimal 📊',
    platform: 'facebook',
    contentType: 'carousel',
    status: 'published',
    scheduledDate: '2026-08-27T14:00',
    publishedDate: '2026-08-27T14:00',
    pillar: 'Educational',
    caption: `Budget iklan Rp 50.000/hari bisa dapat ROAS 4.5x? Ini breakdown framework kami di Meta Ads Manager 💡\n\nBanyak yang mengira pasang iklan di Facebook & Instagram harus budget puluhan juta. Kenyataannya, struktur funneling yang tepat jauh lebih penting daripada bakar uang.\n\nGeser slide sampai akhir untuk melihat:\n📌 Slide 1: Struktur Campaign Advantage+\n📌 Slide 2: Setting Audience Broad vs Lookalike\n📌 Slide 3: Creative Fatigue & Cara Rotasi Visual\n📌 Slide 4: Real Case Study ROAS 4.5x\n\nShare ke tim marketing kamu sekarang!`,
    hooks: [
      'Strategi Meta Ads Rp 50rb/hari yang menghasilkan jutaan',
      'Jangan pasang iklan Meta sebelum paham 4 slide ini!'
    ],
    cta: 'Bagikan postingan ini & klik link di bio untuk download E-book panduan Ads gratis.',
    hashtags: ['#MetaAds', '#FacebookAdsIndonesia', '#BisnisOnline', '#MarketingStrategy', '#MetaBusinessSuite'],
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    mediaUrls: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
    ],
    author: {
      name: 'Dimas Wicaksono',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Performance Lead'
    },
    metaPostId: 'meta_fb_839201948271',
    metaPermalink: 'https://facebook.com/brandstudionusantara/posts/839201948271',
    notes: 'Carousel 7 slide format PDF/PNG resolusi 1080x1350px.',
    checklist: [
      { id: 'c1', text: 'Desain carousel di Figma', done: true },
      { id: 'c2', text: 'Proofreading data studi kasus', done: true },
      { id: 'c3', text: 'Setup custom link UTM tracking', done: true },
      { id: 'c4', text: 'Publish ke Facebook Page & Cross-post ke IG', done: true }
    ],
    calloutText: 'High Link CTR: Menghasilkan 680 klik link langsung ke landing page pendaftaran webinar!',
    calloutEmoji: '📈',
    targetAudience: 'Agency Owners, Media Buyers & UMKM Founders',
    campaign: 'Meta Ads Academy Launch',
    performance: {
      reach: 34200,
      impressions: 48900,
      likes: 1840,
      comments: 198,
      shares: 640,
      saves: 1420,
      clicks: 680,
      engagementRate: 7.2,
      viralityScore: 82,
      costPerResult: 350
    },
    createdAt: '2026-08-22T11:00',
    updatedAt: '2026-08-28T09:15'
  },
  {
    id: 'post-3',
    title: 'Behind The Scenes: Setup Notion Workflow & Kalender Konten Tim Kreatif Kami 🎬',
    platform: 'instagram',
    contentType: 'reel',
    status: 'scheduled',
    scheduledDate: '2026-09-05T18:00',
    pillar: 'Behind The Scenes',
    caption: `Intip cara kami memproduksi 30+ konten per bulan tanpa burnout menggunakan Notion Dashboard! ☕✨\n\nDari brainstorming ide, scripting dengan bantuan AI, approval klien, sampai direct tracking insight dari Meta Business Suite—semuanya tersentralisasi dalam satu sistem.\n\nKomen "NOTION" kalau kamu mau dibikinin template gratisnya! 📥`,
    hooks: [
      'Cara kami manage 30 konten sebulan cuma pakai 1 aplikasi',
      'Setup workspace Notion tim kreatif yang bikin kerjaan 3x lebih rapi!'
    ],
    cta: 'Ketik "NOTION" di DM untuk dapat link download template gratis!',
    hashtags: ['#NotionWorkspace', '#ContentPlanning', '#NotionTemplate', '#ProductivityID', '#SocialMediaAgency'],
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Sarah Nabila',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Creative Director'
    },
    notes: 'Sound: Trending aesthetic lo-fi chill beat.',
    checklist: [
      { id: 'c1', text: 'Record screen recording Notion workspace', done: true },
      { id: 'c2', text: 'Voiceover recording & audio cleanup', done: true },
      { id: 'c3', text: 'Approval dari Head Marketing', done: true },
      { id: 'c4', text: 'Scheduling di Meta Suite jam 6 sore', done: false }
    ],
    targetAudience: 'Digital Marketers, Freelancers & Project Managers',
    campaign: 'Q3 Brand Awareness Sprint',
    createdAt: '2026-08-28T16:00',
    updatedAt: '2026-09-01T10:00'
  },
  {
    id: 'post-4',
    title: 'TikTok Viral Series: 3 Kesalahan Fatal Saat Launching Brand Maklon Skin Care 💄',
    platform: 'tiktok',
    contentType: 'video',
    status: 'review',
    scheduledDate: '2026-09-07T20:00',
    pillar: 'Tips & Tricks',
    caption: `Mau punya brand skincare sendiri tapi takut gagal? Hindari 3 blunder ini saat awal mulai! ❌\n\n1. Asal pilih pabrik maklon tanpa izin BPOM & Halal yang jelas\n2. Tidak riset USP produk (Formula pasaran yang tidak unik)\n3. Fokus kemasan tanpa menyiapkan budget marketing Meta Ads\n\nDrop pertanyaan kamu tentang izin maklon kosmetik di komen ya!`,
    hooks: [
      'Jangan bikin brand skincare sebelum tau 3 rahasia maklon ini!',
      'Alasan 80% brand skincare baru gulung tikar di tahun pertama'
    ],
    cta: 'Follow @brandstudio.erp untuk tips maklon & bisnis kecantikan harian!',
    hashtags: ['#BisnisSkincare', '#MaklonKosmetik', '#TipsBisnis', '#TikTokMarketing', '#BrandKecantikan'],
    coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    notes: 'Review script dengan tim QC & Legal Maklon.',
    checklist: [
      { id: 'c1', text: 'Scripting & Hook Validation', done: true },
      { id: 'c2', text: 'Legal clearance untuk terminology BPOM', done: true },
      { id: 'c3', text: 'Shooting & Editing', done: false }
    ],
    targetAudience: 'Calon Beautypreneur & Beauty Influencer',
    campaign: 'Maklon Skincare Intake Q3',
    createdAt: '2026-08-29T11:00',
    updatedAt: '2026-09-01T14:20'
  },
  {
    id: 'post-5',
    title: 'Infografis Trend Formula Skincare 2026: Niacinamide + Peptide Combination ✨',
    platform: 'instagram',
    contentType: 'single_post',
    status: 'idea',
    scheduledDate: '2026-09-10T12:00',
    pillar: 'Product Highlight',
    caption: `Kenapa kombinasi Niacinamide + Peptide bakal mendominasi pasar skincare tahun ini? 🧪\n\nRiset tren konsumen menunjukkan pencarian bahan aktif anti-aging + brightening meningkat 240% di Meta Search & Google Trends. Simak infografis lengkapnya!`,
    hooks: [
      'Bahan aktif skincare yang paling dicari konsumen tahun ini!'
    ],
    cta: 'Save infografis ini untuk referensi formulasi produk brand kamu!',
    hashtags: ['#FormulasiKosmetik', '#SkincareTrends', '#Niacinamide', '#Peptides', '#InovasiKecantikan'],
    coverImage: 'https://images.unsplash.com/photo-1608248597261-e4d09447e70a?w=800&auto=format&fit=crop&q=80',
    author: {
      name: 'Sarah Nabila',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Creative Director'
    },
    notes: 'Brainstorming awal konsep visual infografis.',
    checklist: [
      { id: 'c1', text: 'Riset jurnal formulasi terbaru', done: true },
      { id: 'c2', text: 'Draft copy infografis', done: false }
    ],
    targetAudience: 'Formulator R&D, Brand Owners & Skincare Enthusiast',
    campaign: 'Maklon Skincare Intake Q3',
    createdAt: '2026-09-01T09:00',
    updatedAt: '2026-09-01T09:00'
  }
];

export const initialMetaInsights: MetaInsightsSummary = {
  totalReach: 142500,
  impressions: 218900,
  profileVisits: 12400,
  websiteClicks: 3850,
  netFollowers: 1420,
  engagementRate: 6.8,
  reachGrowthPercent: 18.4,
  impressionsGrowthPercent: 24.1,
  engagementGrowthPercent: 4.2,
  followersGrowthPercent: 8.9,
  storiesReach: 18400,
  reelsViews: 96500,
  avgEngagementPerPost: 7.4
};

export const initialDailyTrends: MetaDailyTrend[] = [
  { date: '2026-08-25', reach: 18200, impressions: 26400, engagement: 1420, followersGain: 180, facebookReach: 6200, instagramReach: 12000 },
  { date: '2026-08-26', reach: 21500, impressions: 31200, engagement: 1890, followersGain: 240, facebookReach: 7500, instagramReach: 14000 },
  { date: '2026-08-27', reach: 24800, impressions: 38900, engagement: 2150, followersGain: 310, facebookReach: 8900, instagramReach: 15900 },
  { date: '2026-08-28', reach: 19400, impressions: 28900, engagement: 1640, followersGain: 190, facebookReach: 6800, instagramReach: 12600 },
  { date: '2026-08-29', reach: 17900, impressions: 25400, engagement: 1380, followersGain: 150, facebookReach: 6100, instagramReach: 11800 },
  { date: '2026-08-30', reach: 22100, impressions: 34100, engagement: 1980, followersGain: 220, facebookReach: 7900, instagramReach: 14200 },
  { date: '2026-08-31', reach: 18600, impressions: 27800, engagement: 1520, followersGain: 170, facebookReach: 6400, instagramReach: 12200 }
];

export const initialDemographics: DemographicData = {
  ageGender: [
    { group: '18-24', male: 12, female: 28 },
    { group: '25-34', male: 22, female: 42 },
    { group: '35-44', male: 14, female: 18 },
    { group: '45-54', male: 5, female: 8 },
    { group: '55+', male: 2, female: 3 }
  ],
  topCities: [
    { city: 'Jakarta', percent: 38 },
    { city: 'Surabaya', percent: 22 },
    { city: 'Bandung', percent: 16 },
    { city: 'Medan', percent: 12 },
    { city: 'Semarang', percent: 12 }
  ],
  topCountries: [
    { country: 'Indonesia', percent: 92 },
    { country: 'Malaysia', percent: 4 },
    { country: 'Singapore', percent: 3 },
    { country: 'Lainnya', percent: 1 }
  ]
};

export const initialBestTimeSlots: BestTimeSlot[] = [
  {
    day: 'Senin',
    hourScores: [
      { hour: 9, score: 65, label: 'Sedang' },
      { hour: 12, score: 85, label: 'Tinggi' },
      { hour: 18, score: 92, label: 'Sangat Tinggi' },
      { hour: 21, score: 78, label: 'Tinggi' }
    ]
  },
  {
    day: 'Rabu',
    hourScores: [
      { hour: 9, score: 70, label: 'Tinggi' },
      { hour: 12, score: 88, label: 'Tinggi' },
      { hour: 19, score: 96, label: 'Sangat Tinggi' },
      { hour: 21, score: 82, label: 'Tinggi' }
    ]
  },
  {
    day: 'Jumat',
    hourScores: [
      { hour: 11, score: 80, label: 'Tinggi' },
      { hour: 15, score: 75, label: 'Tinggi' },
      { hour: 19, score: 98, label: 'Sangat Tinggi' },
      { hour: 21, score: 89, label: 'Sangat Tinggi' }
    ]
  }
];

export const initialCampaignOkrs: CampaignOKR[] = [
  {
    id: 'okr-1',
    title: 'Q3 Brand Awareness & Organic Reach Acceleration',
    objective: 'Meningkatkan total jangkauan organik akun Meta (IG & FB) sebesar 50% di Q3 2026',
    targetMetric: 'Total Organic Reach',
    currentValue: 142500,
    targetValue: 200000,
    unit: 'reach',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'on_track',
    associatedPosts: ['post-1', 'post-3'],
    color: '#2563eb'
  },
  {
    id: 'okr-2',
    title: 'Meta Ads Conversion & Lead Intake Drive',
    objective: 'Menghasilkan 500+ Qualified Inbound Lead melalui kampanye Advantage+ Meta Ads',
    targetMetric: 'Inbound Leads',
    currentValue: 340,
    targetValue: 500,
    unit: 'leads',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    status: 'on_track',
    associatedPosts: ['post-2', 'post-4'],
    color: '#059669'
  },
  {
    id: 'okr-3',
    title: 'Audience Engagement Rate Optimization',
    objective: 'Mencapai rata-rata Engagement Rate di atas 7.5% untuk postingan edukasi & Behind The Scenes',
    targetMetric: 'Avg Engagement Rate',
    currentValue: 6.8,
    targetValue: 7.5,
    unit: '%',
    startDate: '2026-08-15',
    endDate: '2026-09-30',
    status: 'at_risk',
    associatedPosts: ['post-1', 'post-5'],
    color: '#d97706'
  }
];
