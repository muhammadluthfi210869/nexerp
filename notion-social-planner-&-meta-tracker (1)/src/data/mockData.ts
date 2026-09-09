import { PostItem, MetaAccountConfig, MetaInsightsSummary, MetaDailyTrend, DemographicData, BestTimeSlot, CampaignOKR } from '../types';

export const initialMetaAccount: MetaAccountConfig = {
  accessToken: 'EAAQ...meta_bus_suite_tok_sample',
  pageId: '109283746592019',
  pageName: 'BrandStudio Nusantara',
  igAccountId: '17841405829103948',
  igUsername: '@brandstudio.id',
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
    notes: 'Kamera: 4K 60fps, Color Grading Warm Notion Tone, Voiceover energetic.',
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
    scheduledDate: '2026-09-02T18:00',
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
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    notes: 'Rekam screen recording Notion dashboard + b-roll suasana kantor estetik.',
    checklist: [
      { id: 'c1', text: 'Screen record Notion database view', done: true },
      { id: 'c2', text: 'Take b-roll typing & coffee aesthetic', done: true },
      { id: 'c3', text: 'Pilih trending audio Instagram', done: true },
      { id: 'c4', text: 'Jadwalkan di Meta Business Suite untuk besok', done: true }
    ],
    calloutText: 'Scheduled: Siap dipublish otomatis sesuai jam prime time audiens Instagram (18:00 WIB).',
    calloutEmoji: '⏰',
    targetAudience: 'Productivity Enthusiasts, Notion Users & Social Media Teams',
    campaign: 'Productivity & Notion Series',
    createdAt: '2026-08-29T14:30',
    updatedAt: '2026-08-31T16:00'
  },
  {
    id: 'post-4',
    title: 'Tips & Trik: Cara Membaca Data Meta Business Suite Biar Gak Salah Strategi Konten 🔍',
    platform: 'instagram',
    contentType: 'carousel',
    status: 'scheduled',
    scheduledDate: '2026-09-04T12:15',
    pillar: 'Tips & Tricks',
    caption: `Banyak creator cuma lihat "Likes", padahal di Meta Business Suite ada 3 metrik yang jauh lebih menentukan pertumbuhan akun:\n\n1. Accounts Reached vs Non-Followers % (Menentukan apakah kontenmu disebar ke audiens baru)\n2. Saves-to-Reach Ratio (Standar bagus: > 2.5%)\n3. Retention Rate Video di 5 Detik Pertama\n\nSimpan panduan ini untuk evaluasi bulanan akunmu! 📈`,
    hooks: [
      'Jangan cuma bangga sama Likes! Ini 3 data Meta Suite paling krusial',
      'Metrik rahasia yang bikin akun kamu direkomendasikan algoritma'
    ],
    cta: 'Simpan postingan ini untuk acuan audit akun akhir bulan!',
    hashtags: ['#MetaInsights', '#AnalyticsID', '#InstagramAnalytics', '#SocialMediaTracker', '#ContentStrategy'],
    coverImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Dimas Wicaksono',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Performance Lead'
    },
    notes: 'Visual infografis dengan tone warna minimalist dark/white high contrast.',
    checklist: [
      { id: 'c1', text: 'Screenshot dashboard Meta Business Suite', done: true },
      { id: 'c2', text: 'Highlight angka metrik dengan lingkaran merah/kuning', done: true },
      { id: 'c3', text: 'Final check copy & font readability', done: false }
    ],
    targetAudience: 'Digital Marketers, UMKM & Account Managers',
    campaign: 'Data-Driven Creator series',
    createdAt: '2026-08-30T09:00',
    updatedAt: '2026-08-31T11:00'
  },
  {
    id: 'post-5',
    title: 'Review Tool AI untuk Social Media Planner: Mana yang Paling Worth It di 2026? 🤖',
    platform: 'threads',
    contentType: 'single_post',
    status: 'review',
    scheduledDate: '2026-09-06T10:00',
    pillar: 'Educational',
    caption: `Testing 5 AI Social Media Assistant selama 30 hari. Hasilnya mengejutkan:\n\n- Gemini 3.7 Flash: Paling natural untuk copywriting Bahasa Indonesia & memahami konteks lokal.\n- Tool X: Bagus untuk auto-hashtag tapi sering halusinasi.\n- Notion AI: Sangat cepat untuk drafting langsung di workspace.\n\nKalian paling sering pakai AI apa untuk riset konten? Drop di reply! 👇`,
    hooks: [
      'Perbandingan 5 AI Social Media Assistant paling populer 2026',
      'Mana AI yang beneran bisa bikin caption natural bahasa Indonesia?'
    ],
    cta: 'Reply di bawah tools favorit kamu!',
    hashtags: ['#AITools', '#TechReview', '#ThreadsID', '#ArtificialIntelligence'],
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Sarah Amalia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Copywriter'
    },
    notes: 'Format text thread interaktif dengan lampiran 1 gambar komparasi.',
    checklist: [
      { id: 'c1', text: 'Review hasil perbandingan tool', done: true },
      { id: 'c2', text: 'Approval dari Creative Director', done: false }
    ],
    targetAudience: 'Tech enthusiasts, Content Creators',
    createdAt: '2026-08-31T08:00',
    updatedAt: '2026-08-31T15:00'
  },
  {
    id: 'post-6',
    title: 'Flash Sale Promo 9.9: Exclusive Social Media Growth Bundle 🎁',
    platform: 'facebook',
    contentType: 'single_post',
    status: 'scripting',
    scheduledDate: '2026-09-09T00:01',
    pillar: 'Promotional',
    caption: `PROMO 9.9 MEGA SALE! 🚀 Dapatkan akses ke 100+ Template Notion Social Planner, 50 Hook Video Viral, dan Panduan Meta Business Suite Tracker dengan diskon 70%!\n\nHanya berlaku 24 jam untuk 100 pembeli pertama. Klik link di bawah sekarang sebelum kuota habis!`,
    hooks: [
      'PROMO 9.9 MEGA SALE! Diskon 70% Hari Ini Saja!',
      'Upgrade workflow social media kamu dengan harga super hemat!'
    ],
    cta: 'Klaim voucher diskon sekarang di link resmi kami!',
    hashtags: ['#Promo99', '#DiskonSpesial', '#SocialMediaBundle', '#BisnisOnline'],
    coverImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Sarah Amalia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Copywriter'
    },
    notes: 'Drafting banner visual promo dengan badge Diskon 70%.',
    checklist: [
      { id: 'c1', text: 'Drafting copywriting penawaran', done: true },
      { id: 'c2', text: 'Desain banner 1080x1080px', done: false },
      { id: 'c3', text: 'Setup kode voucher di landing page', done: false }
    ],
    targetAudience: 'All Followers & Warm Prospects',
    campaign: 'Mega Promo 9.9 Campaign',
    createdAt: '2026-08-31T10:00',
    updatedAt: '2026-08-31T10:00'
  },
  {
    id: 'post-7',
    title: 'Ide Konten Interaktif: Kuis Tebak Algoritma Meta & Hadiah Spesial 🎯',
    platform: 'instagram',
    contentType: 'story',
    status: 'idea',
    scheduledDate: '2026-09-12T11:00',
    pillar: 'Community',
    caption: `Story series 4 slide interaktif dengan sticker Poll & Quiz: "Mitos atau Fakta: Shadowban Instagram itu nyata?"\n\nPemenang yang jawab benar semua dapat free template Notion Planner!`,
    hooks: ['Mitos atau Fakta seputar Algoritma Instagram? Uji pengetahuanmu!'],
    cta: 'Vote di sticker polling sekarang!',
    hashtags: ['#InstagramQuiz', '#CommunityEngagement', '#StoryIdeas'],
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    notes: 'Siapkan 4 slide background estetik di Canva.',
    checklist: [
      { id: 'c1', text: 'Susun 3 pertanyaan quiz menarik', done: false },
      { id: 'c2', text: 'Desain format Story 9:16', done: false }
    ],
    targetAudience: 'Active Instagram Story Viewers',
    createdAt: '2026-08-31T12:00',
    updatedAt: '2026-08-31T12:00'
  },
  {
    id: 'post-8',
    title: 'Studi Kasus: Bagaimana Akun UMKM Fashion Ini Naik 400% Followers Organik 👗',
    platform: 'instagram',
    contentType: 'reel',
    status: 'published',
    scheduledDate: '2026-08-18T20:00',
    publishedDate: '2026-08-18T20:00',
    pillar: 'Product Highlight',
    caption: `Formula 3 pilar konten yang berhasil melipatgandakan omset dan followers brand fashion lokal hanya dalam 60 hari! 🌟\n\nKuncinya ada di konsistensi storytelling dan pemanfaatan format Reels di Meta Business Suite dengan hook visual yang kuat.\n\nCek rinciannya di video ini!`,
    hooks: [
      'Rahasia brand lokal naik 400% followers tanpa beli followers!',
      'Gimana cara jualan di Instagram tanpa terkesan hard-selling?'
    ],
    cta: 'Follow @brandstudio.id untuk update strategi bisnis harian!',
    hashtags: ['#StudiKasus', '#UMKMIndonesia', '#FashionBusiness', '#MetaBusiness', '#ReelsGrowth'],
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    metaPostId: 'meta_ig_182049182311',
    metaPermalink: 'https://instagram.com/p/C_sample08',
    notes: 'Kombinasi interview founder + visual produk cinematic.',
    checklist: [
      { id: 'c1', text: 'Take interview clip', done: true },
      { id: 'c2', text: 'Editing fast-paced', done: true }
    ],
    calloutText: 'High Shares: Banyak dibagikan ulang oleh komunitas UMKM dan pebisnis muda.',
    calloutEmoji: '💎',
    targetAudience: 'Fashion Enthusiasts & UMKM Founders',
    campaign: 'UMKM Growth Spotlight',
    performance: {
      reach: 42100,
      impressions: 53200,
      likes: 3120,
      comments: 184,
      shares: 980,
      saves: 1540,
      videoViews: 48900,
      clicks: 290,
      engagementRate: 8.4,
      viralityScore: 88
    },
    createdAt: '2026-08-15T09:00',
    updatedAt: '2026-08-19T10:00'
  },
  {
    id: 'post-9',
    title: '5 Tren Social Media Marketing Q3 2026 yang Wajib Diantisipasi Brand 📈',
    platform: 'linkedin',
    contentType: 'carousel',
    status: 'published',
    scheduledDate: '2026-07-28T09:00',
    publishedDate: '2026-07-28T09:00',
    pillar: 'Educational',
    caption: `Pergeseran algoritma Meta & LinkedIn di semester 2 2026 menuntut brand untuk lebih fokus pada authentic first-person storytelling daripada generic corporate posts.\n\nBerikut 5 poin insight riset kami:\n1. Zero-Click Content\n2. Micro-Community DMs\n3. AI-Assisted Fast Iteration\n4. Video Vertical Dominance\n5. Employee Advocacy`,
    hooks: ['5 Perubahan Besar Social Media Marketing di Semester 2 2026'],
    cta: 'Bagikan insight ini ke tim marketing kamu di LinkedIn!',
    hashtags: ['#SocialMediaTrends', '#Marketing2026', '#ContentStrategyID', '#B2BMarketing'],
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Dimas Wicaksono',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Performance Lead'
    },
    notes: 'Carousel PDF 6 slide tone korporat modern.',
    checklist: [
      { id: 'c1', text: 'Kompilasi riset industri', done: true },
      { id: 'c2', text: 'Desain layout LinkedIn slide', done: true }
    ],
    targetAudience: 'Marketing Directors, C-Level, Agencies',
    campaign: 'Thought Leadership 2026',
    performance: {
      reach: 28400,
      impressions: 39500,
      likes: 1450,
      comments: 132,
      shares: 420,
      saves: 890,
      clicks: 340,
      engagementRate: 6.8,
      viralityScore: 79
    },
    createdAt: '2026-07-20T10:00',
    updatedAt: '2026-07-28T10:00'
  },
  {
    id: 'post-10',
    title: 'Recap Webinar: Cara Optimalisasi Meta Business Suite untuk Agensi 🎥',
    platform: 'youtube',
    contentType: 'video',
    status: 'published',
    scheduledDate: '2026-07-15T15:00',
    publishedDate: '2026-07-15T15:00',
    pillar: 'Educational',
    caption: `Full rekaman sesi workshop 90 menit kupas tuntas fitur Meta Business Suite API & automated scheduler untuk scale agensi digital.\n\nLink tonton di YouTube kami!`,
    hooks: ['Rekaman Workshop Meta Business Suite untuk Agensi Digital'],
    cta: 'Tonton video lengkap di channel YouTube BrandStudio!',
    hashtags: ['#WebinarMarketing', '#YouTubeID', '#MetaSuiteWorkshop'],
    coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    notes: 'Video durasi 45 menit dengan timecode chapter lengkap.',
    checklist: [
      { id: 'c1', text: 'Render video & audio mastering', done: true },
      { id: 'c2', text: 'Buat thumbnail YouTube click-worthy', done: true }
    ],
    targetAudience: 'Agency Team, Freelancers',
    campaign: 'Webinar Series',
    performance: {
      reach: 19800,
      impressions: 31200,
      likes: 980,
      comments: 88,
      shares: 210,
      saves: 560,
      videoViews: 14200,
      clicks: 190,
      engagementRate: 5.9,
      viralityScore: 71
    },
    createdAt: '2026-07-10T14:00',
    updatedAt: '2026-07-16T10:00'
  },
  {
    id: 'post-11',
    title: 'Teaser Q4 Roadmap & Halloween Special Content Launch 🎃',
    platform: 'instagram',
    contentType: 'reel',
    status: 'idea',
    scheduledDate: '2026-10-15T19:00',
    pillar: 'Entertainment',
    caption: `Spooky season is coming! 🎃 Siapkan konten interaktif seru bertema Halloween & Q4 holiday sales boost.`,
    hooks: ['Siap-siap buat campaign terbesar tahun ini!'],
    cta: 'Nyalakan notifikasi biar ga ketinggalan!',
    hashtags: ['#Halloween2026', '#ContentPlanner', '#Q4Strategy'],
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Sarah Amalia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Copywriter'
    },
    notes: 'Konsep video visual playful dark Halloween lighting.',
    checklist: [
      { id: 'c1', text: 'Brainstorm konsep gamifikasi', done: false },
      { id: 'c2', text: 'Drafting script & props', done: false }
    ],
    targetAudience: 'All followers',
    campaign: 'Q4 Holiday Kickoff',
    createdAt: '2026-08-31T15:00',
    updatedAt: '2026-08-31T15:00'
  },
  {
    id: 'post-12',
    title: 'Brand Anniversary Giveaway & Community Gathering Invitation 🎉',
    platform: 'instagram',
    contentType: 'carousel',
    status: 'scripting',
    scheduledDate: '2026-10-24T10:00',
    pillar: 'Community',
    caption: `Merayakan 5 tahun perjalanan BrandStudio bersama 100K+ komunitas kreator nusantara! 🎉 Ikuti giveaway total hadiah Rp 25 Juta & tiket gathering offline di Jakarta.`,
    hooks: ['Total Hadiah Rp 25 Juta! Giveaway Akbar 5th Anniversary'],
    cta: 'Komen ucapan terunik & tag 3 sahabat kreatormu!',
    hashtags: ['#BrandStudio5th', '#GiveawayIndonesia', '#CommunityFirst'],
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    mediaUrls: ['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'],
    author: {
      name: 'Revi Yustianawati',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Content Strategist'
    },
    notes: 'Visual festive confetti emas & hitam premium.',
    checklist: [
      { id: 'c1', text: 'Finalisasi syarat & ketentuan giveaway', done: true },
      { id: 'c2', text: 'Kerjasama sponsor & merchandise', done: false }
    ],
    targetAudience: 'Loyal Followers & Brand Advocates',
    campaign: '5th Anniversary Festival',
    createdAt: '2026-08-31T15:30',
    updatedAt: '2026-08-31T15:30'
  }
];

export const initialMetaInsights: MetaInsightsSummary = {
  totalReach: 328450,
  impressions: 492100,
  profileVisits: 28400,
  websiteClicks: 4920,
  netFollowers: 3240,
  engagementRate: 8.6,
  reachGrowthPercent: 24.8,
  impressionsGrowthPercent: 31.2,
  engagementGrowthPercent: 18.5,
  followersGrowthPercent: 14.3,
  storiesReach: 86400,
  reelsViews: 241900,
  avgEngagementPerPost: 3840
};

export const initialDailyTrends: MetaDailyTrend[] = [
  { date: '2026-08-20', reach: 8400, impressions: 12200, engagement: 890, followersGain: 95, facebookReach: 2400, instagramReach: 6000 },
  { date: '2026-08-21', reach: 9800, impressions: 14100, engagement: 1040, followersGain: 112, facebookReach: 2800, instagramReach: 7000 },
  { date: '2026-08-22', reach: 12400, impressions: 18600, engagement: 1320, followersGain: 145, facebookReach: 3600, instagramReach: 8800 },
  { date: '2026-08-23', reach: 15900, impressions: 23400, engagement: 1890, followersGain: 210, facebookReach: 4200, instagramReach: 11700 },
  { date: '2026-08-24', reach: 11200, impressions: 16500, engagement: 1210, followersGain: 130, facebookReach: 3100, instagramReach: 8100 },
  { date: '2026-08-25', reach: 24800, impressions: 38900, engagement: 3450, followersGain: 410, facebookReach: 6200, instagramReach: 18600 },
  { date: '2026-08-26', reach: 21400, impressions: 32100, engagement: 2980, followersGain: 340, facebookReach: 5800, instagramReach: 15600 },
  { date: '2026-08-27', reach: 28900, impressions: 44200, engagement: 4120, followersGain: 490, facebookReach: 9200, instagramReach: 19700 },
  { date: '2026-08-28', reach: 19800, impressions: 29400, engagement: 2640, followersGain: 280, facebookReach: 5100, instagramReach: 14700 },
  { date: '2026-08-29', reach: 22100, impressions: 33800, engagement: 3100, followersGain: 320, facebookReach: 5900, instagramReach: 16200 },
  { date: '2026-08-30', reach: 26500, impressions: 40100, engagement: 3850, followersGain: 430, facebookReach: 7400, instagramReach: 19100 },
  { date: '2026-08-31', reach: 31200, impressions: 48200, engagement: 4690, followersGain: 510, facebookReach: 8900, instagramReach: 22300 }
];

export const initialDemographics: DemographicData = {
  ageGender: [
    { group: '18-24', male: 14, female: 22 },
    { group: '25-34', male: 28, female: 38 },
    { group: '35-44', male: 18, female: 24 },
    { group: '45-54', male: 6, female: 9 },
    { group: '55+', male: 2, female: 3 }
  ],
  topCities: [
    { city: 'Jakarta', percent: 38.5 },
    { city: 'Surabaya', percent: 18.2 },
    { city: 'Bandung', percent: 14.6 },
    { city: 'Medan', percent: 9.4 },
    { city: 'Yogyakarta', percent: 8.1 },
    { city: 'Semarang', percent: 6.2 },
    { city: 'Makassar', percent: 5.0 }
  ],
  topCountries: [
    { country: 'Indonesia', percent: 86.4 },
    { country: 'Malaysia', percent: 6.8 },
    { country: 'Singapore', percent: 3.9 },
    { country: 'Australia', percent: 1.8 },
    { country: 'Others', percent: 1.1 }
  ]
};

export const initialBestTimeSlots: BestTimeSlot[] = [
  {
    day: 'Senin',
    hourScores: [
      { hour: 9, score: 65, label: 'Sedang' },
      { hour: 12, score: 82, label: 'Tinggi' },
      { hour: 15, score: 70, label: 'Sedang' },
      { hour: 18, score: 88, label: 'Prime Time' },
      { hour: 20, score: 94, label: 'Paling Aktif' },
      { hour: 22, score: 60, label: 'Menurun' }
    ]
  },
  {
    day: 'Selasa',
    hourScores: [
      { hour: 9, score: 70, label: 'Sedang' },
      { hour: 12, score: 85, label: 'Tinggi' },
      { hour: 15, score: 75, label: 'Sedang' },
      { hour: 18, score: 92, label: 'Prime Time' },
      { hour: 20, score: 96, label: 'Paling Aktif' },
      { hour: 22, score: 68, label: 'Sedang' }
    ]
  },
  {
    day: 'Rabu',
    hourScores: [
      { hour: 9, score: 68, label: 'Sedang' },
      { hour: 12, score: 84, label: 'Tinggi' },
      { hour: 15, score: 78, label: 'Sedang' },
      { hour: 18, score: 90, label: 'Prime Time' },
      { hour: 20, score: 95, label: 'Paling Aktif' },
      { hour: 22, score: 65, label: 'Sedang' }
    ]
  },
  {
    day: 'Kamis',
    hourScores: [
      { hour: 9, score: 72, label: 'Sedang' },
      { hour: 12, score: 88, label: 'Tinggi' },
      { hour: 15, score: 80, label: 'Tinggi' },
      { hour: 18, score: 94, label: 'Prime Time' },
      { hour: 20, score: 98, label: 'Paling Aktif' },
      { hour: 22, score: 72, label: 'Sedang' }
    ]
  },
  {
    day: 'Jumat',
    hourScores: [
      { hour: 9, score: 75, label: 'Sedang' },
      { hour: 12, score: 70, label: 'Sedang (Sholat)' },
      { hour: 15, score: 82, label: 'Tinggi' },
      { hour: 18, score: 90, label: 'Prime Time' },
      { hour: 20, score: 99, label: 'Paling Aktif' },
      { hour: 22, score: 85, label: 'Tinggi' }
    ]
  },
  {
    day: 'Sabtu',
    hourScores: [
      { hour: 10, score: 88, label: 'Tinggi' },
      { hour: 13, score: 82, label: 'Sedang' },
      { hour: 16, score: 85, label: 'Tinggi' },
      { hour: 19, score: 95, label: 'Prime Time' },
      { hour: 21, score: 92, label: 'Tinggi' },
      { hour: 23, score: 78, label: 'Sedang' }
    ]
  },
  {
    day: 'Minggu',
    hourScores: [
      { hour: 9, score: 90, label: 'Tinggi (Weekend Pagi)' },
      { hour: 12, score: 84, label: 'Tinggi' },
      { hour: 15, score: 86, label: 'Tinggi' },
      { hour: 18, score: 96, label: 'Prime Time' },
      { hour: 20, score: 97, label: 'Paling Aktif' },
      { hour: 22, score: 75, label: 'Sedang' }
    ]
  }
];

export const initialCampaignOkrs: CampaignOKR[] = [
  {
    id: 'okr-1',
    title: 'Q3 Brand Awareness & Reach 500K',
    objective: 'Meningkatkan total monthly reach di Meta Business Suite ke 500,000 akun unik.',
    targetMetric: 'Total Monthly Reach',
    currentValue: 328450,
    targetValue: 500000,
    unit: 'Reach',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'on_track',
    associatedPosts: ['post-1', 'post-2', 'post-8'],
    color: '#2383e2'
  },
  {
    id: 'okr-2',
    title: 'Tembus 75K Followers Instagram Organik',
    objective: 'Mencapai 75,000 active followers di akun @brandstudio.id dengan konten edukasi Reels.',
    targetMetric: 'IG Followers',
    currentValue: 62800,
    targetValue: 75000,
    unit: 'Followers',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'on_track',
    associatedPosts: ['post-1', 'post-3', 'post-8'],
    color: '#e03e3e'
  },
  {
    id: 'okr-3',
    title: 'Jaga Engagement Rate Rata-rata di Atas 8%',
    objective: 'Mempertahankan interaksi berkualitas tinggi (Saves & Shares) di setiap postingan.',
    targetMetric: 'Avg Engagement Rate',
    currentValue: 8.6,
    targetValue: 8.0,
    unit: '%',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    status: 'completed',
    associatedPosts: ['post-1', 'post-2', 'post-8'],
    color: '#0f7b6c'
  },
  {
    id: 'okr-4',
    title: 'Konversi 1,000 Pendaftar Webinar Meta Ads',
    objective: 'Mengumpulkan 1,000 link clicks dan registrasi lewat Carousel edukasi Facebook & IG.',
    targetMetric: 'Website Registrations',
    currentValue: 680,
    targetValue: 1000,
    unit: 'Leads',
    startDate: '2026-08-15',
    endDate: '2026-09-15',
    status: 'on_track',
    associatedPosts: ['post-2'],
    color: '#d9730d'
  }
];
