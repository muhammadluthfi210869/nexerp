# SSOT — KPI Benchmark Reference (National + Global, Multi-Industry)

> Sub-dokumen dari `_SSOT_FINAL.md`.
> Versi: 1.1 | Tanggal: 2026-09-17 | Status: **PROVENANCE** (referensi benchmark; kontrak per-person ada di `contracts/`)

---

## 1. Ringkasan Keputusan

| Aspek | Keputusan | Rationale |
|-------|-----------|-----------|
| **Per-person KPI** | **IN SCOPE mulai 2026-09-17** | Keputusan lama untuk skip telah digantikan; lihat REQ-035/036 dan BUS-RULE-072/074/090/106. |
| **Reference KPI** | **National + Global, multi-industry** | User: "ga usah fokus ke salah satu industri juga ga apa apa si" |
| **Update frequency** | **Quarterly review** (3 bulan sekali) | Standard untuk benchmark tracking |
| **Override mechanism** | Admin can override per role/division jika ada target spesifik klien | Configurable |

**Prinsip**: KPI ini adalah **referensi arah**, bukan hard target. Admin dapat override sesuai realita klien. Setelah cukup data historis dari NEX running, akan jadi data-driven baseline.

---

## 2. Quality Control (QC) Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **First Pass Yield (FPY)** | 85-90% (manufacturing umum) | 90-95% (lean manufacturing) | **≥ 90%** |
| **Defect Rate** | 2-5% | 1-3% | **≤ 3%** |
| **Customer Reject Rate (Returns)** | 1-3% | 0.5-2% | **≤ 1.5%** |
| **Cost of Poor Quality (COPQ)** | 5-10% revenue | 3-6% | **≤ 6%** |
| **Scrap Rate** | 1-2% | 0.5-1% | **≤ 1%** |
| **Rework Rate** | 3-5% | 1-3% | **≤ 3%** |
| **Audit Finding Closure Time** | 30 hari | 14 hari | **≤ 21 hari** |

---

## 3. Production / Operations Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **OEE (Overall Equipment Effectiveness)** | 60-75% | 75-85% (world-class 85%+) | **≥ 75%** |
| **Machine Uptime / Availability** | 85-90% | 90-95% | **≥ 90%** |
| **Performance Rate** | 80-85% | 85-95% | **≥ 85%** |
| **Quality Rate (in OEE)** | 90-95% | 95-99% | **≥ 95%** |
| **On-Time Delivery (OTD)** | 75-85% | 90-95% | **≥ 90%** |
| **Lead Time (Order to Delivery)** | Industri-specific | Industri-specific | Track & improve 5%/quarter |
| **Cycle Time (Production)** | Industri-specific | Industri-specific | Track & improve |
| **Capacity Utilization** | 70-80% | 75-85% | **70-85%** (sweet spot, >90% = bottleneck risk) |
| **Work-In-Progress (WIP)** | Minim | Minim | Track trend |
| **Inventory Turnover** | 4-6x/year (manufacturing) | 6-12x/year | **≥ 6x** |

---

## 4. Digital Marketing (Digimar) Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **CTR (Click-Through Rate)** | 0.5-1.5% | 1-3% | **≥ 1.5%** |
| **Conversion Rate (Click → Lead)** | 2-5% | 3-8% | **≥ 3%** |
| **Cost Per Lead (CPL)** | Rp 15K-50K (varies by industry) | $5-$50 | **< Rp 30K** |
| **CPC (Cost Per Click)** | Rp 500-3K | $0.5-$3 | **< Rp 2K** |
| **CPM (Cost Per Mille)** | Rp 25K-100K | $5-$30 | **< Rp 75K** |
| **Lead-to-Sample Rate** | 30-50% | 40-60% | **≥ 40%** |
| **Sample-to-Close Rate** | 20-40% | 30-50% | **≥ 30%** |
| **ROAS (Return on Ad Spend)** | 3-5x | 4-8x | **≥ 4x** |
| **Engagement Rate (Social)** | 1-3% | 3-6% | **≥ 3%** |
| **Follower Growth (Monthly)** | 2-5% | 3-8% | **≥ 3%** |

---

## 5. BusDev / Sales Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **Lead Response Time** | 1-4 hours | < 1 hour (5 min ideal) | **≤ 2 hours** |
| **Lead-to-Opportunity Rate** | 30-50% | 40-60% | **≥ 40%** |
| **Opportunity-to-Win Rate** | 15-30% | 20-40% | **≥ 20%** |
| **Average Deal Size** | Industri-specific | Industri-specific | Track trend |
| **Sales Cycle Length** | 30-60 hari (B2B) | 30-90 hari (B2B) | **Track & reduce** |
| **Pipeline Coverage** | 3x target | 3-5x target | **≥ 3x** |
| **Win Rate** | 20-30% | 25-35% | **≥ 25%** |
| **Customer Acquisition Cost (CAC)** | Rp 500K-2M | $200-$1K | **Track trend** |
| **Customer Lifetime Value (CLV)** | 3-5x CAC | 3-7x CAC | **≥ 3x CAC** |
| **Churn Rate (Repeat Customer Lost)** | 5-10% | 3-7% | **≤ 5%** |

---

## 6. Finance Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **Gross Profit Margin** | 15-25% | 25-40% | **≥ 20%** |
| **Net Profit Margin** | 3-10% | 5-15% | **≥ 5%** |
| **Operating Margin** | 5-15% | 10-20% | **≥ 10%** |
| **Current Ratio** | 1.0-1.5 | 1.5-2.0 | **≥ 1.2** |
| **Quick Ratio** | 0.8-1.2 | 1.0-1.5 | **≥ 0.9** |
| **Debt-to-Equity** | 1.0-2.0 | 0.5-1.5 | **≤ 2.0** |
| **Days Sales Outstanding (DSO)** | 45-60 days | 30-45 days | **≤ 45 days** |
| **Days Payable Outstanding (DPO)** | 30-45 days | 30-60 days | **30-45 days** |
| **Cash Conversion Cycle** | 60-90 days | 30-60 days | **≤ 60 days** |
| **AR Aging (>90 days)** | 10-15% | 5-10% | **≤ 10%** |
| **AP Aging (>60 days)** | 5-10% | 3-7% | **≤ 5%** |
| **Collection Rate** | 85-90% | 90-95% | **≥ 90%** |

---

## 7. SCM / Procurement Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **Supplier On-Time Delivery (OTD)** | 70-85% | 85-95% | **≥ 85%** |
| **Supplier Defect Rate** | 2-5% | 1-3% | **≤ 2%** |
| **Purchase Order Cycle Time** | 3-7 days | 1-5 days | **≤ 5 days** |
| **Cost Variance vs Budget** | 5-10% | 2-5% | **≤ 5%** |
| **Emergency Purchase Ratio** | 10-20% | 5-10% | **≤ 10%** |
| **Supplier Concentration (top 3)** | 40-60% | 30-50% | **≤ 50%** |
| **Inventory Accuracy** | 95-98% | 98-99% | **≥ 98%** |
| **Stockout Rate** | 2-5% | 0.5-2% | **≤ 2%** |

---

## 8. Warehouse Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **Order Picking Accuracy** | 95-98% | 99%+ | **≥ 98%** |
| **Order Fulfillment Cycle Time** | 4-8 hours | 1-4 hours | **≤ 4 hours** |
| **Storage Utilization** | 75-85% | 80-90% | **75-85%** |
| **Inventory Turnover** | 4-6x/year | 6-12x/year | **≥ 6x** |
| **FIFO/FEFO Compliance** | 90-95% | 95-99% | **≥ 95%** |
| **Damaged Stock Rate** | 1-3% | 0.5-1% | **≤ 1%** |
| **Dead Stock Ratio** | 5-10% | 2-5% | **≤ 5%** |

---

## 9. R&D Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **First-Time Approval Rate** | 60-75% | 70-85% | **≥ 70%** |
| **Sample Cycle Time** | 7-14 days | 5-10 days | **≤ 10 days** |
| **On-Time Sample Rate** | 70-85% | 80-95% | **≥ 80%** |
| **Average Revisions per Sample** | 1.5-2.5 | 1-2 | **≤ 2** |
| **Failed/Abandoned Sample Rate** | 10-20% | 5-10% | **≤ 10%** |
| **Chemist Utilization** | 70-85% | 75-90% | **75-85%** (sweet spot, >95% = overload) |

---

## 10. HR Benchmark

| KPI | National (ID) | Global | Recommended Target |
|-----|---------------|---------|-------------------|
| **Employee Turnover (Annual)** | 10-20% | 8-15% | **≤ 15%** |
| **Time to Fill (Hiring)** | 30-60 days | 20-45 days | **≤ 45 days** |
| **Training Hours per Employee/Year** | 20-40 hours | 40-60 hours | **≥ 30 hours** |
| **Employee Satisfaction (eNPS)** | 0-20 | 20-50 | **≥ 20** |
| **Absenteeism Rate** | 2-4% | 1-3% | **≤ 3%** |
| **Productivity per Employee** | Industri-specific | Industri-specific | Track trend |

---

## 11. Data Source References

### 11.1. National (Indonesia) Sources

- **BPS** (Badan Pusat Statistik) — Manufacturing sector statistics
- **Kemenperin** — Industri manufaktur KPI standards
- **CPKB** (Cara Pembuatan Kosmetika yang Baik) — BPOM-regulated quality standards
- **SNI** (Standar Nasional Indonesia) — Quality benchmarks
- **IAPI** (Indonesian Institute of Accountants) — Finance benchmarks
- **Apindo** — HR & workforce benchmarks

### 11.2. Global Sources

- **APICS / ASCM** — Supply chain & production (OEE benchmarks)
- **ISO 9001** — Quality management standards
- **Six Sigma** — Defect rate benchmarks
- **HubSpot / Salesforce** — Sales KPI benchmarks (per industry)
- **Google Ads Benchmarks** — CTR, CPC, CPL by industry
- **Meta Ads Benchmarks** — Same by industry
- **Deloitte / PwC** — Finance benchmarks by industry
- **SHRM** — HR benchmarks by country
- **McKinsey Global Institute** — Operations productivity

### 11.2. How to Use This Benchmark

For each KPI in `KPI_REFERENCE.md`:
- Look up recommended target in this doc
- Override if admin sets different target
- Track gap between actual (live data) and benchmark
- Quarterly review to adjust

---

## 12. Open Questions

1. **Quarterly review mechanism** — manual review by admin or automated alert?
2. **Per-division override** — allow each division head to set different target?
3. **Source data for benchmarks** — link to actual research papers/reports? (Default: just list sources)
4. **KPI dashboard display** — show "vs benchmark" toggle? (Recommend YES)

---

**Dokumen ini adalah referensi benchmark untuk KPI. Ubah dokumen ini dulu sebelum mengubah KPI thresholds di `KPI_REFERENCE.md`.**
