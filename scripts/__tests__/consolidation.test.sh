#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Regresi KONSOLIDASI (2026-09): production-light merged into main
# ═══════════════════════════════════════════════════════════════
#  Menjamin hasil merge konsolidasi:
#   - Full ERP tetap utuh (tidak ada kebocoran pemangkasan production-light)
#   - Infra deploy production-light (profiles, nginx, scripts) terpakai di main
#   - Perbaikan bugfix produksi (management-task, jwt cookie, WA gateway) ada
#   - Artefak workflow dua-branch (bridge) bersih
# Jalankan manual: bash scripts/__tests__/consolidation.test.sh
# ═══════════════════════════════════════════════════════════════
set -uo pipefail
cd "$(dirname "$0")/../.."

PASS=0; FAIL=0
ok()  { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

# ── 1. Full ERP utuh ──
[ "$(ls backend/prisma/schema/*.prisma 2>/dev/null | wc -l)" -ge 19 ] \
  && ok "19+ file skema Prisma (full ERP)" || bad "jumlah file skema Prisma < 19"
grep -q "WaWebhookModule" backend/src/app.module.ts \
  && ok "WaWebhookModule terdaftar" || bad "WaWebhookModule tidak terdaftar"
grep -q "wa-gateway.controller.ts" backend/src/modules/wa-webhook/wa-webhook.module.ts 2>/dev/null \
  || [ -f backend/src/modules/wa-webhook/wa-gateway.controller.ts ] \
  && ok "wa-gateway controller ada (adapter Wablas/Mesolitica/Fonnte)" \
  || bad "wa-gateway controller hilang"
grep -qE "LeadCaptureModule|lead-capture" backend/src/app.module.ts \
  && ok "Modul lead-capture terdaftar" || bad "Modul lead-capture hilang"

# Tidak ada kebocoran pemangkasan: modul yang dikomentari
if grep -qE "^\s*//\s*(import .*Module|CommercialModule|FinanceModule)" backend/src/app.module.ts; then
  bad "ada modul dikomentari (pemangkasan production-light bocor ke main)"
else
  ok "tidak ada modul dikomentari di app.module.ts"
fi

# ── 2. Infra deploy (versi production-light yang dipakai) ──
grep -q 'profiles:' docker-compose.yml && grep -q 'server' docker-compose.yml \
  && ok "compose punya profile server (nginx/certbot)" || bad "compose kehilangan profile server"
grep -qE 'image: *ghcr\.io/[^ ]*/backend:\$\{IMAGE_TAG' docker-compose.yml \
  && ok "compose backend pakai image GHCR + IMAGE_TAG" || bad "compose backend bukan GHCR/IMAGE_TAG"
grep -qE 'image: *ghcr\.io/[^ ]*/frontend:\$\{IMAGE_TAG' docker-compose.yml \
  && ok "compose frontend pakai image GHCR + IMAGE_TAG" || bad "compose frontend bukan GHCR/IMAGE_TAG"
grep -q "max-old-space-size" docker-compose.yml \
  && ok "guard memory Node ada (VPS 4GB)" || bad "guard memory Node hilang"
[ ! -f docker-compose.prod.yml ] && ok "docker-compose.prod.yml usang dihapus" || bad "docker-compose.prod.yml masih ada"
grep -q "no-store" nginx.conf && ok "nginx no-store cache guard" || bad "nginx kehilangan no-store"

# ── 3. Perbaikan produksi ──
[ "$(grep -c 'ARG JWT_SECRET' frontend/Dockerfile)" -ge 2 ] \
  && ok "frontend Dockerfile: JWT_SECRET build+runtime (fix 78dcf10+88ba5a8)" \
  || bad "frontend Dockerfile kehilangan ARG JWT_SECRET"
grep -q "token=" backend/src/modules/auth/jwt.strategy.ts \
  && ok "jwt cookie-fallback untuk attachment <img> (fix light)" \
  || bad "jwt cookie-fallback hilang"
grep -q "db push" backend/init-db.sh && ! grep -q "migrate deploy" backend/init-db.sh \
  && ok "init-db.sh pakai db push (bukan migrate deploy)" || bad "init-db.sh salah filosofi schema"
grep -q "DRIFT_MARKER" backend/init-db.sh \
  && ok "init-db.sh idempotent (drift marker)" || bad "init-db.sh kehilangan drift marker"
# Urutan aman: pemanggilan `npx prisma db push` pertama harus TANPA --accept-data-loss
FIRST_PUSH=$(grep -n "npx prisma db push" backend/init-db.sh | head -1)
if echo "$FIRST_PUSH" | grep -vq -- "--accept-data-loss" && [ -n "$FIRST_PUSH" ]; then
  ok "init-db.sh: safe-first push (tanpa accept-data-loss duluan)"
else
  bad "init-db.sh: accept-data-loss langsung (berbahaya)"
fi
grep -q -- "--print" backend/init-db.sh \
  && ok "init-db.sh: dry-run gate sebelum accept-data-loss" || bad "init-db.sh tidak punya dry-run gate"

# ── 4. Halaman marketing hasil recovery + fix produksi ──
MT="frontend/src/app/(dashboard)/marketing/management-task"
# ponytail: ManagementTaskBoard.tsx dihapus pada branch fix/mgmt-task-production-ready
# (full cleanup; hanya TaskWorkspaceV2 yang aktif). Test ini mengunci NEGATIF-nya.
if [ -f "$MT/ManagementTaskBoard.tsx" ]; then
  bad "ManagementTaskBoard.tsx masih ada (dead code — dihapus pada full-cleanup)"
else
  ok "ManagementTaskBoard.tsx dihapus sesuai full-cleanup (canonical-only)"
fi
[ -f "$MT/TaskWorkspaceV2.tsx" ] && ok "TaskWorkspaceV2 + components (canonical workspace)" || bad "TaskWorkspaceV2 hilang"
[ -f "$MT/components/TaskDetailModal.tsx" ] && ok "TaskDetailModal (attachment ala Notion)" || bad "TaskDetailModal hilang"
[ -f "frontend/src/app/(dashboard)/samples/lead-capture/LeadCaptureDashboard.tsx" ] \
  && ok "lead-capture (WA tracking Fase 2-4) ada di /samples/" || bad "lead-capture hilang"
[ -f "frontend/src/app/(dashboard)/samples/omni-crm/OmniCrmClient.tsx" ] \
  && ok "omni-crm ada di /samples/" || bad "omni-crm hilang"

# ── 4b. Kontrak DB live (ditemukan oleh drift-analysis cutover 2026-09-14) ──
# Skema HARUS Deklarasikan semua yang dipakai database produksi — kalau tidak,
# `prisma db push` saat cutover akan DROP tabel/kolom berisi data live.
SCH=backend/prisma/schema
grep -q "model MarketingTeamMember" $SCH/marketing.prisma \
  && ok "schema: MarketingTeamMember (live: 35 baris data)" \
  || bad "schema: MarketingTeamMember HILANG — db push akan DROP marketing_team_members (35 baris live!)"
grep -q "model MarketingTaskComment" $SCH/marketing.prisma \
  && ok "schema: MarketingTaskComment" || bad "schema: MarketingTaskComment HILANG"
grep -q "model MarketingTaskAttachment" $SCH/marketing.prisma \
  && ok "schema: MarketingTaskAttachment" || bad "schema: MarketingTaskAttachment HILANG"
for col in whatsappClickedAt assignedSalesId verificationStatus sourcePage; do
  grep -q "$col" $SCH/marketing.prisma \
    && ok "schema: LeadCapture.$col" \
    || bad "schema: LeadCapture.$col HILANG — db push akan DROP kolom yang dipakai live"
done
grep -q "marketingTeamMembers" $SCH/auth.prisma \
  && ok "auth.prisma: relasi balik User -> MarketingTeamMember" \
  || bad "auth.prisma: relasi marketingTeamMembers hilang"
# Route backend yang dipanggil frontend TaskWorkspaceV2 (marketing-service HttpMarketingService):
CC=backend/src/modules/marketing/canonical/canonical-marketing.controller.ts
for r in "'members'" "'tasks/kpi'" "attachments" "comments"; do
  grep -qE "@(Get|Post|Patch|Delete)\(.*$r" $CC \
    && ok "backend: route $r tersedia" \
    || bad "backend: route $r TIDAK ADA — frontend memanggilnya"
done

# ── 5. Bersih dari workflow dua-branch ──
[ ! -f scripts/bridge-to-production-light.sh ] && ok "bridge script hilang" || bad "bridge script masih ada"
[ ! -f scripts/safe-merge.sh ] && ok "safe-merge hilang" || bad "safe-merge masih ada"
[ ! -f scripts/__tests__/bridge-to-production-light.test.sh ] \
  && ok "test bridge ikut dihapus" || bad "test bridge masih ada"
grep -qiE "CHERRY-PICK|bridge" docs/LEAD-CAPTURE-SYSTEM.md 2>/dev/null \
  && echo "  ℹ️  docs/LEAD-CAPTURE-SYSTEM.md masih menyebut bridge (historis — OK)"

echo ""
echo "═══════════════════════════════════════"
echo "  consolidation: $PASS pass / $FAIL fail"
echo "═══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
