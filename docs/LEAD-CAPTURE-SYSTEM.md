# Zero-Friction Lead Capture System — DreamLab.id

## 🎯 Architecture Overview

```
User visits dreamlab.id
  │
  ├─► LeadTracker (invisible) captures:
  │     session_id, pages visited, UTM params,
  │     device info, scroll depth, exit intent
  │
  ├─► User clicks SmartWhatsAppButton
  │     │
  │     ├─► POST /api/lead-capture/track
  │     │     { intent, pageUrl, referrer, UTM,
  │     │       deviceType, browser, sessionId }
  │     │
  │     ├─► Returns: { trackingCode: "DL4F2A", waUrl }
  │     │
  │     └─► Redirect to WhatsApp with tracking code:
  │           https://wa.me/628xx?text=...%0A[Kode%3A%20DL4F2A]
  │
  ├─► User sends WA message with tracking code
  │
  ├─► System detects message (via WhatsApp Business API / manual)
  │     ├─► Extracts: phone number + tracking code
  │     └─► PUT /api/lead-capture/whatsapp/DL4F2A
  │           { phone, waName, waMessage }
  │
  └─► Lead is created/updated in CRM database
        ├─► Name: from WA profile / natural conversation
        ├─► Phone: auto-extracted
        ├─► Intent: from page context
        └─► Source: UTM / referrer tracking
```

## 🧩 Components

### 1. Database (Prisma: `LeadCapture`)
- `lead_captures` table with fields for:
  - Website tracking (session, intent, page, UTM, device)
  - WhatsApp data (phone, WA name, message)
  - CRM fields (name, company, email, notes)
  - Pipeline status (workflow status, lost reason, won/lost dates)

### 2. Backend API (`/api/lead-capture`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/track` | POST | No | Store pre-click data, return tracking code |
| `/whatsapp/:code` | PUT | No | Update lead with WA data |
| `/` | GET | Yes | List leads (paginated, filterable) |
| `/stats` | GET | Yes | Lead statistics |
| `/:id` | GET | Yes | Get single lead |
| `/:id` | PATCH | Yes | Update lead data |
| `/bulk-update` | POST | Yes | Bulk status update |
| `/:id` | DELETE | Yes | Delete lead |

### 3. Frontend Components

#### `SmartWhatsAppButton`
Zero-friction CTA button for dreamlab.id:
```tsx
<SmartWhatsAppButton
  intent="Konsultasi Produk Skincare"
  label="Tanya via WhatsApp"
  variant="primary"
  size="lg"
/>
```

Props:
- `intent` — Konteks produk/layanan yang diminati user
- `phoneNumber` — Nomor WA tujuan (default: dari env)
- `message` — Pesan default
- `variant` — primary | outline | ghost
- `size` — sm | md | lg
- `onTracked` — Callback setelah tracking
- `onError` — Callback jika gagal

#### `LeadTracker`
Invisible tracking component (pasang di layout):
- Captures session, pages, scroll depth, exit intent
- Stores data in localStorage, sent on WA click

#### `LeadCaptureDashboard`
Admin dashboard (di `/marketing/lead-capture`):
- Real-time lead list with search & filter
- Inline editing for name, status
- Bulk status updates
- Lead detail panel
- Statistics cards

## 🚀 Deployment

### 1. Set Environment Variables
```env
# Backend
WA_BUSINESS_PHONE=6281234567890

# Frontend
NEXT_PUBLIC_WA_PHONE=6281234567890
NEXT_PUBLIC_API_URL=https://nexerp.id
```

### 2. Database Migration
```bash
npx prisma db push
```

### 3. Add to dreamlab.id Pages
```tsx
// Import components
import SmartWhatsAppButton from '@/components/lead-capture/SmartWhatsAppButton';
import LeadTracker from '@/components/lead-capture/LeadTracker';

// In layout (invisible tracker)
<LeadTracker />

// In page CTAs
<SmartWhatsAppButton intent="Konsultasi Produk" />

// With custom styling
<SmartWhatsAppButton
  intent="Beli Bahan Baku"
  label="Mulai Konsultasi"
  variant="outline"
  size="lg"
  className="w-full"
/>
```

## 📊 Zero-Friction Flow

| Step | User Action | System Captures | Friction |
|------|-------------|-----------------|----------|
| 1 | Visit dreamlab.id | Session, UTM, device | None (invisible) |
| 2 | Click WA button | Intent, page, referrer → tracking code | None (instant) |
| 3 | Send WA message | Phone number, WA name | None (natural) |
| 4 | Chat with sales | Name (conversation) | Low (natural) |

## 🔐 Data Flow

```
Website (Client)
  │ POST /track { intent, page, session, UTM }
  ▼
Backend (NestJS)
  │ Stores in PostgreSQL (lead_captures table)
  │ Returns tracking code
  ▼
WhatsApp
  │ User messages → phone + tracking code extracted
  │ PUT /whatsapp/:code { phone, waName }
  ▼
CRM Database
  │ Full lead record: { tracking, phone, intent, source, name }
  ▼
Sales Dashboard
  │ Real-time view, filtering, bulk actions
```

## 🔧 Tech Stack

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Tracking**: Client-side (localStorage + API)
- **WhatsApp**: wa.me deep links + Business API (optional)
