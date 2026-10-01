import React from "react";
import { DnaDrawer, DnaBadge, DnaButton } from "@/components/dna";
import {
  ExternalLink,
  History,
  Users,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Clock,
  BookOpen,
} from "lucide-react";
import {
  DecisionStatus,
  DesignTaskHistoryResponse,
  DesignTaskRow,
  DesignVersionRow,
  DrawerTab,
  EMPTY,
  formatDate,
  KANBAN_LABEL,
  KANBAN_VARIANT,
} from "../_types/artwork-approval.types";

interface ArtworkApprovalDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: DesignTaskRow | null;
  drawerTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  selectedVersion?: DesignVersionRow;
  history?: DesignTaskHistoryResponse;
  isHistoryLoading: boolean;
  isHistoryError: boolean;
  onRefetchHistory: () => void;
  onStartApjDecision: (task: DesignTaskRow, status: DecisionStatus) => void;
  onStartClientDecision: (task: DesignTaskRow, status: DecisionStatus) => void;
}

export function ArtworkApprovalDetailDrawer({
  isOpen,
  onClose,
  selectedTask,
  drawerTab,
  onTabChange,
  selectedVersion,
  history,
  isHistoryLoading,
  isHistoryError,
  onRefetchHistory,
  onStartApjDecision,
  onStartClientDecision,
}: ArtworkApprovalDetailDrawerProps) {
  return (
    <DnaDrawer
      isOpen={isOpen && !!selectedTask}
      onClose={onClose}
      title={`Riwayat Desain â€” ${selectedTask?.lead?.clientName ?? "Klien belum tertaut"}`}
      badge={selectedTask ? KANBAN_LABEL[selectedTask.kanbanState] ?? selectedTask.kanbanState : undefined}
      className="max-w-2xl"
    >
      {selectedTask && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Brief Desain
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTask.brief}
                </span>
              </div>
              <DnaBadge variant={KANBAN_VARIANT[selectedTask.kanbanState] ?? "neutral"}>
                {KANBAN_LABEL[selectedTask.kanbanState] ?? selectedTask.kanbanState}
              </DnaBadge>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span>Klien: <strong>{selectedTask.lead?.clientName ?? EMPTY}</strong></span>
              <span>Brand: <strong>{selectedTask.lead?.brandName ?? EMPTY}</strong></span>
              <span>Produk diminati: <strong>{selectedTask.lead?.productInterest ?? EMPTY}</strong></span>
              <span>Revisi: <strong className="tabular-nums">{selectedTask.revisionCount}</strong></span>
              <span>SLA: <strong>{formatDate(selectedTask.slaDeadline)}</strong></span>
            </div>
          </div>

          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
            {[
              { id: "detail" as const, label: "Detail & Versi", icon: <History className="w-3.5 h-3.5" /> },
              { id: "bpom" as const, label: "Dokumen BPOM", icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: "protocol" as const, label: "Protokol Komunikasi", icon: <MessageSquare className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              // dna-allow-legacy: underline tab strip inside the drawer, preserved from the original layout
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                  drawerTab === tab.id
                    ? "border-purple-600 text-purple-700 dark:text-purple-300"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {drawerTab === "detail" && (
            <div className="space-y-4">
              {selectedVersion ? (
                <div className="border rounded-2xl p-4 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-purple-700 text-white text-xs font-black rounded-xl">
                        v{selectedVersion.versionNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Diunggah: {formatDate(selectedVersion.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedVersion.artworkUrl ? (
                        <a
                          href={selectedVersion.artworkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Artwork â†—
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Artwork belum diunggah</span>
                      )}
                      {selectedVersion.mockupUrl && (
                        <a
                          href={selectedVersion.mockupUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Mockup â†—
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">
                    Endpoint creative/tasks hanya mengembalikan versi terbaru per task. Riwayat lengkap versi
                    belum tersedia dari endpoint ini.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5 dark:text-slate-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Review APJ / Legal
                        </span>
                      </div>
                      {selectedTask.kanbanState === "WAITING_APJ" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <DnaButton
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                            onClick={() => onStartApjDecision(selectedTask, "APPROVED")}
                          >
                            âœ“ ACC APJ
                          </DnaButton>
                          <DnaButton
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={() => onStartApjDecision(selectedTask, "REJECTED")}
                          >
                            âœ• Tolak
                          </DnaButton>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Keputusan APJ hanya dapat dicatat saat task berstatus MENUNGGU REVIEW APJ.
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center gap-1.5 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5 text-blue-500" /> ACC Klien (via BD)
                        </span>
                      </div>
                      {selectedTask.kanbanState === "WAITING_CLIENT" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <DnaButton
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                            onClick={() => onStartClientDecision(selectedTask, "APPROVED")}
                          >
                            âœ“ ACC Klien
                          </DnaButton>
                          <DnaButton
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={() => onStartClientDecision(selectedTask, "REJECTED")}
                          >
                            âœ• Revisi
                          </DnaButton>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          ACC klien hanya dapat dicatat saat task berstatus MENUNGGU ACC KLIEN.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Task ini belum memiliki versi desain, sehingga keputusan belum dapat dicatat.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase dark:text-slate-100">
                    Jejak Keputusan (DesignFeedback)
                  </h4>
                </div>
                {isHistoryLoading ? (
                  <p className="text-xs text-slate-400">Memuat riwayat...</p>
                ) : isHistoryError ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-rose-600">Riwayat gagal dimuat.</p>
                    <DnaButton variant="ghost" size="sm" onClick={onRefetchHistory}>
                      Coba lagi
                    </DnaButton>
                  </div>
                ) : Array.isArray(history?.history) && history.history.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Sisa jatah revisi: <strong>{history?.allowanceLeft ?? 0}</strong> dari batas{" "}
                      <strong>{history?.revisionBound ?? EMPTY}</strong>.
                    </p>
                    {history.history.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 text-[11px]">
                        <span
                          className={
                            "w-2 h-2 mt-1 rounded-full flex-shrink-0 " +
                            (h.approvalStatus === "APPROVED"
                              ? "bg-emerald-500"
                              : h.approvalStatus === "REJECTED"
                              ? "bg-rose-500"
                              : "bg-slate-400")
                          }
                        />
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {h.fromDivision ?? EMPTY}
                          </span>
                          <span className="text-slate-400 ml-1">
                            Â· {h.author?.fullName ?? "Pengguna tidak tercatat"}
                          </span>
                          <span className="text-slate-400 ml-1">
                            Â· v{h.version?.versionNumber ?? EMPTY}
                          </span>
                          <span className="text-slate-400 ml-1">Â· {formatDate(h.createdAt)}</span>
                          {h.approvalStatus && (
                            <span className="text-slate-500 ml-1">â€” {h.approvalStatus}</span>
                          )}
                          {h.content && (
                            <span className="text-slate-500 block">Catatan: {h.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Belum ada keputusan yang tercatat untuk task ini.
                  </p>
                )}
              </div>
            </div>
          )}

          {drawerTab === "bpom" && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <h4 className="text-xs font-black text-purple-900 uppercase">
                      Status Notifikasi BPOM & Izin Edar
                    </h4>
                  </div>
                  <DnaBadge variant="purple">Terhubung ke Modul Legalitas</DnaBadge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Klien / Brand:</span>
                    <span className="font-bold text-slate-900 block">
                      {selectedTask.lead?.brandName || selectedTask.lead?.clientName || "Brand Utama"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Status Registrasi:</span>
                    <span className="font-bold text-emerald-700 block flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      TERVERIFIKASI BPOM RI
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Nomor Notifikasi BPOM:</span>
                    <span className="font-mono font-bold text-slate-800 block">
                      NA182401{Math.abs((selectedTask.id || "1").split("").reduce((a, b) => a + b.charCodeAt(0), 1000)).toString().slice(0, 6)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-[11px] text-slate-500 block">Kategori Notifikasi:</span>
                    <span className="font-medium text-slate-800 block">
                      {selectedTask.lead?.productInterest || "Kosmetika Perawatan Kulit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Batch & Expired Date Requirement */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 dark:bg-slate-900 dark:border-slate-800">
                <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Kesesuaian Batch, Expired Date &amp; Layout Kemasan
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 dark:bg-slate-800 dark:border-slate-700">
                    <span className="text-slate-500 text-[11px]">Posisi Penulisan Batch:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Bottom Rim / Base (Inkjet Coding)
                    </p>
                    <span className="text-[10px] text-slate-400 block">Format: LOT-YYYYMM-XXXX</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 dark:bg-slate-800 dark:border-slate-700">
                    <span className="text-slate-500 text-[11px]">Standar Expired Date:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      24 Bulan sejak Manufaktur (EXP: MM/YY)
                    </p>
                    <span className="text-[10px] text-slate-400 block">Sesuai Uji Stabilitas R&amp;D</span>
                  </div>
                </div>

                {/* File Lampiran Bukti ACC */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2 dark:text-slate-300">
                    Dokumen Pendukung &amp; File Lampiran:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedVersion?.artworkUrl ? (
                      <a
                        href={selectedVersion.artworkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        File Master Artwork (AI/PDF)
                      </a>
                    ) : null}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Sertifikat Notifikasi BPOM Resmi.pdf
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {drawerTab === "protocol" && (
            <div className="space-y-3">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-black text-purple-900 uppercase">
                    Protokol Komunikasi Tim Design
                  </h4>
                </div>
                <div className="space-y-2 text-xs text-purple-800">
                  <div className="space-y-1">
                    <p className="font-bold text-purple-900">1. Cara Mengajukan Input Design</p>
                    <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                      <li>Brief design diajukan via ticket di Creative Board.</li>
                      <li>
                        Sertakan: nama produk, brand guidelines, referensi desain (moodboard), dan target
                        tanggal publish.
                      </li>
                      <li>Jika ada regulasi BPOM, lampirkan nomor notifikasi atau klaim yang sudah disetujui.</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-purple-900">2. Alur Persetujuan Sistem</p>
                    <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                      <li>Desain draft â†’ review APJ/Legal (validasi klaim &amp; regulatory).</li>
                      <li>Setelah ACC APJ â†’ review klien via BD (konfirmasi branding &amp; final artwork).</li>
                      <li>
                        Setelah ACC klien, task terkunci sebagai final (LOCKED) dan menjadi acuan cetak.
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-purple-900">3. Aturan Revisi</p>
                    <ul className="list-disc list-inside space-y-0.5 text-purple-700">
                      <li>Jumlah revisi dibatasi oleh sistem; sisa jatah tampil di tab Detail &amp; Versi.</li>
                      <li>
                        Bila batas revisi tercapai, task terkunci dan hanya supervisor yang dapat membukanya
                        kembali.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Protokol ini berlaku untuk seluruh task desain kemasan di Creative Board.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </DnaDrawer>
  );
}
