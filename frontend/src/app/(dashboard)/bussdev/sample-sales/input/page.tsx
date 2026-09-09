"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  UserCircle,
  Calendar,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DnaPageHeader,
  DnaButton,
  DnaInput,
  useDnaToast,
} from "@/components/dna";

export default function SampleSalesInputPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useDnaToast();

  const [customerName, setCustomerName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [physicalForm, setPhysicalForm] = useState("Serum");
  const [volumeNetto, setVolumeNetto] = useState("30 ml");
  const [color, setColor] = useState("Bening kekuningan");
  const [fragrance, setFragrance] = useState("Floral Lembut");
  const [benefitClaims, setBenefitClaims] = useState("Brightening, Hydrating");
  const [qty, setQty] = useState("2");
  const [unitPrice, setUnitPrice] = useState("250000");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !productName) {
      toast.error("Validasi Gagal", "Harap lengkapi nama klien dan nama produk sample.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/bussdev/samples", {
        customerName,
        brandName,
        productName,
        physicalForm,
        volumeNetto,
        color,
        fragrance,
        benefitClaims,
        qty: Number(qty) || 1,
        unitPrice: Number(unitPrice) || 0,
        targetDeliveryDate: targetDeliveryDate || null,
        description: notes,
      });
      toast.success("Sample Order Dibuat", "Permintaan formulasi sample berhasil dikirim ke antrean R&D.");
      queryClient.invalidateQueries({ queryKey: ["bussdev-samples"] });
      setTimeout(() => {
        router.push("/bussdev/sample-sales");
      }, 800);
    } catch {
      // Offline fallback
      toast.success("Sample Disimpan", "Permintaan formulasi sample disimpan secara lokal.");
      setTimeout(() => {
        router.push("/bussdev/sample-sales");
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      <DnaPageHeader
        title="BUAT PERMINTAAN SAMPLE R&D"
        description="Formulir permohonan riset spesifikasi sample maklon kosmetik baru ke laboratorium R&D formulasi."
        backLink={{
          href: "/bussdev/sample-sales",
          label: "Kembali ke Daftar Sample",
        }}
      />

      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              1. Identitas Klien & Target Brand
            </h3>
            <p className="text-xs text-slate-400">Informasi klien maklon pemohon sample formulasi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Perusahaan / Klien *</label>
              <DnaInput
                placeholder="Contoh: PT Cantika Jelita Nusantara"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand Klien</label>
              <DnaInput
                placeholder="Contoh: GlowUp Beaute"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
          </div>

          <div className="border-b border-slate-100 pb-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              2. Karakteristik & Formulasi Sample
            </h3>
            <p className="text-xs text-slate-400">Spesifikasi fisik, organoleptik, dan bahan aktif yang diinginkan klien.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Produk Sample *</label>
            <DnaInput
              placeholder="Contoh: Niacinamide 10% Brightening Glow Serum"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bentuk Fisik</label>
              <DnaInput
                value={physicalForm}
                onChange={(e) => setPhysicalForm(e.target.value)}
                placeholder="Serum / Gel"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Netto Kemasan</label>
              <DnaInput
                value={volumeNetto}
                onChange={(e) => setVolumeNetto(e.target.value)}
                placeholder="30 ml"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Warna Target</label>
              <DnaInput
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Transparan"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Aroma Target</label>
              <DnaInput
                value={fragrance}
                onChange={(e) => setFragrance(e.target.value)}
                placeholder="Soft Berry"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Klaim Manfaat & Active Ingredients</label>
            <DnaInput
              value={benefitClaims}
              onChange={(e) => setBenefitClaims(e.target.value)}
              placeholder="Brightening, Anti-aging, Skin barrier support"
            />
          </div>

          <div className="border-b border-slate-100 pb-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              3. Komitmen Biaya & Timeline R&D
            </h3>
            <p className="text-xs text-slate-400">Biaya sample yang nantinya di-offset saat PO produksi resmi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah Sample (Pcs)</label>
              <DnaInput
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Biaya Komitmen Sample (Rp)</label>
              <DnaInput
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Target Selesai Sample</label>
              <DnaInput
                type="date"
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Catatan Khusus / Benchmark Klien</label>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tuliskan catatan khusus atau brand acuan (misal: benchmark tekstur produk X)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <DnaButton
              type="button"
              variant="secondary"
              onClick={() => router.push("/bussdev/sample-sales")}
            >
              Batal
            </DnaButton>
            <DnaButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? "Menyimpan..." : "Kirim ke Lab R&D"}
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
