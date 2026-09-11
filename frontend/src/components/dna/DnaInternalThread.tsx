"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Send, MessageSquare, AlertTriangle, Flame, Bell, User, Check, Tag } from "lucide-react";
import { DnaBadge } from "./DnaBadge";
import { DnaButton } from "./DnaButton";
import { DnaTextarea } from "./DnaTextarea";
import { DnaSelect } from "./DnaSelect";
import {
  getSharedInternalNotes,
  addSharedInternalNote,
  addSharedAuditLog,
  type SharedInternalNote,
} from "@/lib/shared-erp-flow";

export interface DnaInternalThreadProps {
  entityId: string;
  currentUserName?: string;
  currentUserRole?: string;
  className?: string;
}

const DEPARTMENTS = [
  "@Finance",
  "@SCM",
  "@PPIC",
  "@QC",
  "@BussDev",
  "@Gudang",
  "@Direksi",
];

const ROLE_BADGE_MAP: Record<string, "info" | "purple" | "emerald" | "amber" | "slate" | "blue" | "danger"> = {
  Finance: "emerald",
  SCM: "blue",
  PPIC: "purple",
  QC: "amber",
  BussDev: "info",
  Gudang: "slate",
  Direksi: "danger",
  Produksi: "info",
};

export function DnaInternalThread({
  entityId,
  currentUserName = "Budi Santoso",
  currentUserRole = "PPIC",
  className,
}: DnaInternalThreadProps) {
  const [notes, setNotes] = useState<SharedInternalNote[]>([]);
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<"NORMAL" | "PENTING" | "URGENT">("NORMAL");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [senderName, setSenderName] = useState(currentUserName);
  const [senderRole, setSenderRole] = useState(currentUserRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = () => {
      setNotes(getSharedInternalNotes(entityId));
    };
    load();

    const handleUpdate = () => {
      load();
    };
    window.addEventListener("nexerp:notes-updated", handleUpdate);
    return () => {
      window.removeEventListener("nexerp:notes-updated", handleUpdate);
    };
  }, [entityId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const created = addSharedInternalNote({
      entityId,
      authorName: senderName,
      authorRole: senderRole,
      content: content.trim(),
      urgency,
      targetDepartment: selectedDept || undefined,
    });

    // Seamlessly add audit log for critical/important collaboration notes
    addSharedAuditLog({
      entityId,
      actor: senderName,
      role: senderRole,
      action: `Catatan Internal [${urgency}] ditambahkan${selectedDept ? ` ke ${selectedDept}` : ""}`,
      notes: content.length > 80 ? content.substring(0, 77) + "..." : content,
      severity: urgency === "URGENT" ? "CRITICAL" : urgency === "PENTING" ? "WARNING" : "INFO",
    });

    setContent("");
    setIsSubmitting(false);
  };

  const handleMentionClick = (dept: string) => {
    setSelectedDept((prev) => (prev === dept ? "" : dept));
    if (!content.includes(dept)) {
      setContent((prev) => (prev ? `${prev} ${dept} ` : `${dept} `));
    }
  };

  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Diskusi & Kolaborasi Internal (Zero-Chat)
          </span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-semibold">
            {notes.length} Catatan
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Bell className="w-3 h-3 text-slate-400" />
          <span>Terdokumentasi otomatis ke Audit Trail</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Belum ada catatan internal pada dokumen ini
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Gunakan thread ini untuk koordinasi lintas divisi (SCM, Finance, PPIC, QC) tanpa berpindah ke WhatsApp atau chat eksternal.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const roleBadge = (note.authorRole && ROLE_BADGE_MAP[note.authorRole]) || "slate";
            const isUrgent = note.urgency === "URGENT";
            const isImportant = note.urgency === "PENTING";

            return (
              <div
                key={note.id}
                className={cn(
                  "p-3.5 rounded-xl border text-xs transition-all shadow-xs",
                  isUrgent
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                    : isImportant
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {note.authorName}
                    </span>
                    <DnaBadge variant={roleBadge} className="text-[10px] px-1.5 py-0 font-medium">
                      {note.authorRole}
                    </DnaBadge>
                    {note.targetDepartment && (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-1.5 py-0.5 rounded-md">
                        {note.targetDepartment}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isUrgent ? (
                      <DnaBadge variant="danger" className="text-[10px] px-1.5 py-0 font-bold animate-pulse">
                        URGENT
                      </DnaBadge>
                    ) : isImportant ? (
                      <DnaBadge variant="warning" className="text-[10px] px-1.5 py-0 font-semibold">
                        PENTING
                      </DnaBadge>
                    ) : (
                      <DnaBadge variant="neutral" className="text-[10px] px-1.5 py-0 font-normal">
                        NORMAL
                      </DnaBadge>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">{note.createdAt}</span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-200 font-normal leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Composer Section */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Department Mention Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" /> Tag Divisi:
          </span>
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedDept === dept;
            return (
              <DnaButton
                key={dept}
                variant={isSelected ? "primary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 px-2 text-[10px] rounded-lg transition-all",
                  isSelected
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
                onClick={() => handleMentionClick(dept)}
              >
                {dept}
              </DnaButton>
            );
          })}
        </div>

        {/* Text Area */}
        <DnaTextarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis instruksi, klarifikasi spesifikasi, atau catatan lintas divisi di sini... (e.g. @Finance dana sudah masuk?)"
          required
        />

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Urgensi:</span>
            <div className="flex items-center gap-1">
              {(["NORMAL", "PENTING", "URGENT"] as const).map((level) => {
                const isActive = urgency === level;
                return (
                  <DnaButton
                    key={level}
                    variant={
                      isActive
                        ? level === "URGENT"
                          ? "danger"
                          : level === "PENTING"
                          ? "secondary"
                          : "primary"
                        : "outline"
                    }
                    size="sm"
                    className={cn(
                      "h-7 px-2.5 text-[10px] font-semibold rounded-lg",
                      !isActive && "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                    onClick={() => setUrgency(level)}
                  >
                    {level === "URGENT" && <Flame className="w-3 h-3 mr-1 text-rose-500" />}
                    {level === "PENTING" && <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />}
                    {level}
                  </DnaButton>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DnaButton
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              icon={<Send className="w-3.5 h-3.5" />}
              className="h-8 px-4 text-xs font-semibold rounded-xl"
            >
              Kirim Catatan
            </DnaButton>
          </div>
        </div>
      </form>
    </div>
  );
}
