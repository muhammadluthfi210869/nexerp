"use client";

import React from "react";
import { Phone, ShieldCheck, FlaskConical, Factory, Edit2 } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import type { MasterCustomerItem } from "../_types/customer.types";

interface CustomerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: MasterCustomerItem | null;
  onEditCustomer: (cust: MasterCustomerItem) => void;
}

export function CustomerDetailDrawer({
  isOpen,
  onClose,
  selectedCustomer,
  onEditCustomer,
}: CustomerDetailDrawerProps) {
  if (!selectedCustomer) return null;

  return (
    <DnaDetailDrawer
      isOpen={isOpen && !!selectedCustomer}
      onClose={onClose}
      title={selectedCustomer?.brandName || "Detail Profil Pelanggan"}
      subtitle={`${selectedCustomer?.customerCode} â€¢ ${selectedCustomer?.nama}`}
      badge={
        selectedCustomer ? (
          <DnaBadge variant={selectedCustomer.kategori === "Pelanggan RO" ? "success" : "info"}>
            {selectedCustomer.kategori}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "brand",
          label: "1. Profil & Legalitas Escrow",
          content: (
            <div className="space-y-4 text-xs">
              {/* Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Kode Klien:</span>
                    <span className="tabular-nums font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-mono">
                      {selectedCustomer.customerCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Nama Brand Maklon:</span>
                    <strong className="text-zinc-900">{selectedCustomer.brandName}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Nama Pemilik / PIC:</span>
                    <strong className="text-zinc-900 block mt-0.5">{selectedCustomer.nama}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Kontak WhatsApp:</span>
                    <a
                      href={`https://wa.me/${selectedCustomer.phone.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tabular-nums font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {selectedCustomer.phone}
                    </a>
                  </div>
                </div>
                {selectedCustomer.birthDate && (
                  <div className="border-t border-zinc-200 pt-2 text-[11px]">
                    <span className="text-zinc-500">Tanggal Lahir Founder: </span>
                    <strong className="text-zinc-800">{selectedCustomer.birthDate}</strong>
                  </div>
                )}
              </div>

              {/* Card Legalitas */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-700" />
                  Tracking Status Legalitas & Sertifikasi
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded border border-zinc-200 text-center">
                    <span className="text-zinc-500 block text-[10px]">Izin BPOM:</span>
                    <strong className="text-zinc-900">{selectedCustomer.legalitasBpom}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-zinc-200 text-center">
                    <span className="text-zinc-500 block text-[10px]">Sertifikat Halal:</span>
                    <strong className="text-zinc-900">{selectedCustomer.legalitasHalal}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-zinc-200 text-center">
                    <span className="text-zinc-500 block text-[10px]">Paten HKI Merk:</span>
                    <strong className="text-zinc-900">{selectedCustomer.legalitasHki}</strong>
                  </div>
                </div>
              </div>

              {/* Card Escrow */}
              <div className="p-4 bg-zinc-900 text-white rounded-xl space-y-2">
                <span className="text-zinc-400 font-bold block text-xs uppercase tracking-wider">
                  Saldo Rekening Titipan Escrow Klien
                </span>
                <div className="tabular-nums font-black text-white text-xl">
                  Rp {selectedCustomer.escrowDeposit.toLocaleString("id-ID")}
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Dana jaminan aman untuk alokasi pembelian kemasan, botol khusus, dan uang muka batch formulasi maklon.
                </p>
              </div>

              {/* Alamat */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Alamat Surat & Kirim:</span>
                <p className="text-slate-700 font-medium mt-1 leading-relaxed">
                  {selectedCustomer.alamatLengkap}
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Wilayah: <strong>{selectedCustomer.kota}, {selectedCustomer.provinsi}</strong>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "sample",
          label: "2. Portofolio Sample R&D",
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-purple-700 text-xs">
                  <FlaskConical className="w-4 h-4 text-purple-600" /> Akumulasi Layanan Sample Formula
                </div>
                <div className="mt-2 text-slate-600 space-y-1">
                  <div>
                    Total Biaya Riset Formula:{" "}
                    <strong className="text-purple-700 tabular-nums">
                      Rp {selectedCustomer.sampleFeeTotal.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div>
                    Status R&D Terakhir:{" "}
                    <strong className="text-slate-900">{selectedCustomer.sampleStatus}</strong>
                  </div>
                  <div className="tabular-nums text-[11px] text-slate-500">
                    Total Permintaan Sample: <strong>{selectedCustomer.soSampleCount} kali</strong>
                  </div>
                </div>
              </div>

              {selectedCustomer.sampleRequests && selectedCustomer.sampleRequests.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Daftar Permintaan Sample Terakhir:
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden">
                    {selectedCustomer.sampleRequests.map((sr: any) => (
                      <div key={sr.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{sr.productName || "Sample Produk"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{sr.sampleCode}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                          {sr.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-white border border-slate-100 rounded-lg">
                  Belum ada riwayat permintaan sample formulasi untuk pelanggan ini.
                </div>
              )}
            </div>
          ),
        },
        {
          id: "orders",
          label: "3. Order Produksi Massal (SPK/SO)",
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                  <Factory className="w-4 h-4 text-emerald-600" /> Kontrak Job Order Produksi Massal
                </div>
                <div className="mt-2 text-slate-600 space-y-1">
                  <div>
                    Total Akumulasi Omset SO:{" "}
                    <strong className="text-emerald-700 tabular-nums">
                      Rp {selectedCustomer.nominalSoProduk.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div>
                    Status Batch Terakhir:{" "}
                    <strong className="text-slate-900">{selectedCustomer.produksiStatus}</strong>
                  </div>
                  <div className="tabular-nums text-[11px] text-slate-500">
                    Total Batch Job Order: <strong>{selectedCustomer.soProdukCount} Batch</strong>
                  </div>
                </div>
              </div>

              {selectedCustomer.salesOrders && selectedCustomer.salesOrders.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Daftar Order Produksi (SO/SPK) Terakhir:
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden">
                    {selectedCustomer.salesOrders.map((so: any) => (
                      <div key={so.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-semibold text-slate-900">{so.orderNumber}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(so.createdAt).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            Rp {Number(so.totalAmount || 0).toLocaleString("id-ID")}
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            {so.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-white border border-slate-100 rounded-lg">
                  Belum ada order produksi massal untuk pelanggan ini.
                </div>
              )}
            </div>
          ),
        },
      ]}
      footerActions={
        <div className="flex gap-2">
          <DnaButton
            variant="secondary"
            size="md"
            onClick={() => {
              onClose();
              if (selectedCustomer) onEditCustomer(selectedCustomer);
            }}
          >
            <Edit2 className="w-4 h-4 mr-1.5" />
            Sunting Data
          </DnaButton>
        </div>
      }
    />
  );
}
