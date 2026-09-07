# 🧬 NEX ERP Unified Design System (Visual DNA)
*Canonical Standard & Master Architecture from Golden Reference*

> **SINGLE SOURCE OF TRUTH**:  
> Seluruh halaman ERP **WAJIB 100% MENIRU** pola visual yang diimplementasikan pada:  
> 👉 [`frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx`](file:///c:/GAWE/Web%20Dev/Porto%20Aureon/ERP%20FROM%20ZERO/frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx)  
> Dilarang menciptakan abstraksi wrapper baru atau mengikuti aturan lama yang bertentangan dengan file master ini.

---

## 🏛️ Anatomi Baku 5 Layer (Urutan Vertikal Halaman)

Setiap halaman operasional di NEX ERP memiliki struktur hirarki vertikal seragam dengan ritme ruang (*vertical rhythm*) berikut:

```
[00. System Alert Banner]         (Opsional, jika ada notifikasi sinkronisasi)
        ↓ (gap 24px)
[01. Ultra-Clean Un-boxed Header] (Link Kembali + Judul Halaman 32px Bold)
        ↓ (gap 24px: mt-6)
[02. 4 KPI Metric Cards]          (Grid 4 kolom, tinggi 104px, 3 layer data)
        ↓ (gap 22px: mt-[22px])
[03. Bordered Tab Nav Container]  (Container tunggal h-[46px], p-1, active blue)
        ↓ (gap 18px: mt-[18px])
[04. Toolbar Filter Bar]          (Search h-9 + Dropdown + Reset + 1 Primary Button)
        ↓ (gap 18px: mt-[18px])
[05. Clean Data Table]            (Thead 40px, Row 42px, tabular-nums, ghost actions)
```

---

## 📐 Spesifikasi & Kode Baku per Layer

### Layer 01: Ultra-Clean Un-boxed Header
Header bersifat bersih, tidak dibungkus card/box, tanpa badge dekoratif yang ramai.
```tsx
<div>
  {/* Back link opsional jika halaman detail/sub-modul */}
  <Link
    href="/parent-path"
    className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors"
  >
    <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke ...
  </Link>
  <h1 className="text-[32px] leading-[40px] font-bold text-slate-900 tracking-tight uppercase">
    NAMA MODUL & HALAMAN
  </h1>
</div>
```

---

### Layer 02: KPI Metric Cards Grid (Maksimal 4 Kartu)
* Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6`
* Tinggi Baku: `h-[104px]`
* Border & Radius: `border rounded-xl p-3.5 shadow-2xs`
* Struktur 3 Layer Maksimum:
  1. `1 Label` (`text-[13px] font-normal text-slate-600`) + Icon badge kecil (`w-6.5 h-6.5 rounded-full`)
  2. `1 Value` (`text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums`)
  3. `1 Supporting Metric` (`text-[11px] font-semibold` atau `text-slate-500 font-normal`)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
  {/* Contoh Kartu 1 (Primary Tint) */}
  <div className="border border-blue-100/80 rounded-xl p-3.5 bg-blue-50/20 shadow-2xs flex flex-col justify-between h-[104px]">
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-normal text-slate-600">Total Omset</span>
      <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[12px] font-bold">
        $
      </div>
    </div>
    <div>
      <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">Rp 279 Jt</p>
      <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
        <TrendingUp className="w-3 h-3" /> +14% vs minggu lalu
      </p>
    </div>
  </div>

  {/* Contoh Kartu 2 (Success Tint) */}
  <div className="border border-emerald-100/80 rounded-xl p-3.5 bg-emerald-50/30 shadow-2xs flex flex-col justify-between h-[104px]">
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-normal text-slate-600">Sample Approved</span>
      <div className="w-6.5 h-6.5 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    </div>
    <div>
      <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">1</p>
      <p className="text-[11px] text-slate-500 font-normal">Yield 94% • Rilis APJ</p>
    </div>
  </div>
</div>
```

---

### Layer 03: Bordered Tab Nav Container
Seluruh tab modul dibungkus dalam **1 container kapsul terpadu** (bukan tab melayang atau garis bawah):
* Container: `bg-white border border-slate-200 rounded-xl p-1 shadow-2xs h-[46px] flex items-center gap-1 overflow-x-auto mt-[22px]`
* Active Tab: `bg-blue-600 text-white shadow-2xs h-[38px] px-4 rounded-lg text-[12px] font-semibold flex items-center gap-2`
* Inactive Tab: `text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-[38px] px-4 rounded-lg text-[12px] font-medium flex items-center gap-2 transition-colors`

```tsx
<div className="bg-white border border-slate-200 rounded-xl p-1 shadow-2xs h-[46px] flex items-center gap-1 overflow-x-auto mt-[22px]">
  {TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={cn(
        "h-[38px] px-4 rounded-lg text-[12px] transition-all shrink-0 cursor-pointer border-none flex items-center gap-2",
        activeTab === tab.id
          ? "bg-blue-600 text-white font-semibold shadow-2xs"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
      )}
    >
      <tab.icon className="w-3.5 h-3.5" />
      {tab.label}
    </button>
  ))}
</div>
```

---

### Layer 04: Toolbar Filter Bar
Toolbar menampung pencarian, filter status, reset, dan **SATU-SATUNYA TOMBOL PRIMARY**:
* Container: `bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 mt-[18px]`
* Kiri: Input Search `h-9` + Select Dropdown `h-9` + Tombol Reset (jika filter aktif)
* Kanan: Single Primary Button (`bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-xl text-[12px] font-semibold`)

```tsx
<div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 mt-[18px]">
  <div className="flex items-center gap-2 w-full md:w-auto">
    <div className="relative flex-1 md:w-64">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Cari kode, nama..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 h-9 text-[12px] text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
      />
    </div>

    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-[12px] text-slate-700 font-medium focus:outline-none focus:border-blue-500"
    >
      <option value="ALL">Semua Status</option>
      <option value="ACTIVE">Aktif</option>
      <option value="COMPLETED">Selesai</option>
    </select>

    {isFilterActive && (
      <button
        onClick={resetAllFilters}
        className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-semibold transition-all border-none cursor-pointer flex items-center gap-1 shrink-0"
      >
        <RotateCcw className="w-3 h-3" /> Reset
      </button>
    )}
  </div>

  {/* SATU-SATUNYA TOMBOL AKSI UTAMA HALAMAN */}
  <button
    onClick={() => setIsCreateModalOpen(true)}
    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs transition-all flex items-center gap-1.5 shrink-0 border-none cursor-pointer"
  >
    <Plus className="w-4 h-4" /> Tambah Data
  </button>
</div>
```

---

### Layer 05: Clean Data Table
* Table Container: `bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mt-[18px]`
* Table Head: `h-10 bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider`
* Table Row: `h-[42px] hover:bg-slate-50/60 border-b border-slate-100 transition-colors`
* Font Data: `text-[12px] text-slate-700 font-medium`
* Angka & Finansial: Wajib `tabular-nums` dan `text-right`
* Row Actions: Subtle Ghost Button (`p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg`) dengan dropdown `...`

```tsx
<div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mt-[18px]">
  <table className="w-full text-left border-collapse text-[12px]">
    <thead>
      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider h-10">
        <th className="w-10 text-center px-3">#</th>
        <th className="px-4">KODE DOKUMEN</th>
        <th className="px-4">NAMA UTAMA</th>
        <th className="px-4">STATUS</th>
        <th className="px-4 text-right">KUANTITAS</th>
        <th className="px-4 text-right">NILAI TOTAL</th>
        <th className="w-16 text-center px-3">AKSI</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {data.map((item, idx) => (
        <tr key={item.id} className="h-[42px] hover:bg-slate-50/60 transition-colors">
          <td className="text-center text-[11px] text-slate-400 font-medium select-none px-3">{idx + 1}</td>
          <td className="px-4 font-bold font-mono text-blue-600 hover:underline cursor-pointer">{item.code}</td>
          <td className="px-4 font-bold text-slate-900">{item.name}</td>
          <td className="px-4">
            <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
              {item.status}
            </span>
          </td>
          <td className="px-4 text-right font-semibold text-slate-800 tabular-nums">{item.qty.toLocaleString("id-ID")}</td>
          <td className="px-4 text-right font-bold text-slate-900 tabular-nums">Rp {item.total.toLocaleString("id-ID")}</td>
          <td className="px-3 text-center">
            <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg border-none bg-transparent cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 🚫 Larangan Keras (Anti-Patterns)
1. **Dilarang membungkus seluruh halaman ke dalam 1 card raksasa** yang menelan tabs dan toolbar.
2. **Dilarang membuat tombol aksi warna-warni kontras di setiap baris tabel** (hindari "efek lampu lalu lintas"). Gunakan tombol halus / ghost icon / titik tiga `...`.
3. **Dilarang menaruh tombol primer acak di dalam card tabel**. Satu-satunya tombol aksi utama berada di sebelah kanan Toolbar Filter Bar.
4. **Dilarang menggabungkan 2 informasi berbeda ke dalam 1 kolom tabel**. Pisahkan tanggal, status, dan kode ke kolom mandiri yang rapi.
5. **Dilarang hardcode warna atau ukuran font di luar skala baku**:
   - Judul Halaman: `text-[32px] leading-[40px] font-bold`
   - KPI Value: `text-[24px] leading-[32px] font-bold`
   - Data Tabel: `text-[12px] font-semibold / font-medium`
   - Header Tabel & Badge: `text-[10px] / text-[11px] uppercase font-bold`
   - Radius: `rounded-xl` (10–12px) untuk semua cards dan inputs.

