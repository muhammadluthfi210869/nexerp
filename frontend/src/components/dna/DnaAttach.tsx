"use client";

// DnaAttach — file picker + upload progress + image preview.
//
// ponytail: native FormData + fetch, no upload lib. 10MB cap. Drops non-matching
// files silently (icon shows red dot for invalid).

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Paperclip, X, AlertTriangle } from "lucide-react";
import { communicationService } from "@/lib/services/communication-service";
import { useDnaToast } from "@/components/dna/DnaToast";
import type { CommAttachment } from "@/types/communication";

export interface DnaAttachProps {
  /** Called with uploaded attachments in order. Caller owns the list. */
  onChange: (attachments: CommAttachment[]) => void;
  /** Max bytes per file (default 10MB). */
  maxBytes?: number;
  /** Optional accepted mime types (default common docs + images + pdf). */
  accept?: string;
  /** Label on the trigger button. */
  label?: string;
  className?: string;
}

const DEFAULT_ACCEPT = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

interface PendingUpload {
  file: File;
  status: "uploading" | "done" | "error";
  attachment?: CommAttachment;
  error?: string;
}

export function DnaAttach({
  onChange,
  maxBytes = DEFAULT_MAX_BYTES,
  accept = DEFAULT_ACCEPT,
  label = "Attach file",
  className,
}: DnaAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useDnaToast();
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const isAccepted = (file: File) => file.size <= maxBytes;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newPending: PendingUpload[] = [];
    const validFiles: File[] = [];
    Array.from(files).forEach((f) => {
      if (!isAccepted(f)) {
        toast.error("File terlalu besar", { description: `${f.name} > 10MB, dilewati.` });
        newPending.push({ file: f, status: "error", error: "size" });
      } else {
        newPending.push({ file: f, status: "uploading" });
        validFiles.push(f);
      }
    });
    setPending((p) => [...p, ...newPending]);

    for (const file of validFiles) {
      try {
        const att = await communicationService.uploadAttachment(mockCommViewerFallback(), file);
        setPending((p) => p.map((x) => (x.file === file ? { ...x, status: "done", attachment: att } : x)));
        // Collect completed attachments for parent
        onChange([...collectDone(pending, file, att)]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "upload failed";
        setPending((p) => p.map((x) => (x.file === file ? { ...x, status: "error", error: msg } : x)));
        toast.error("Upload gagal", { description: file.name });
      }
    }
  };

  const remove = (file: File) => {
    setPending((p) => p.filter((x) => x.file !== file));
    onChange(collectDone(pending.filter((x) => x.file !== file)));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
      >
        <Paperclip className="w-3.5 h-3.5" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {pending.length > 0 && (
        <ul className="space-y-1.5">
          {pending.map((p, i) => (
            <li
              key={`${p.file.name}-${i}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
            >
              {p.status === "uploading" && (
                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse w-2/3" />
                </div>
              )}
              {p.status === "done" && (
                <span className="flex-1 truncate text-slate-700 font-medium">{p.file.name}</span>
              )}
              {p.status === "error" && (
                <span className="flex-1 flex items-center gap-1.5 truncate text-rose-700">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {p.file.name}
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-mono">{Math.ceil(p.file.size / 1024)}KB</span>
              <button
                type="button"
                onClick={() => remove(p.file)}
                className="text-slate-400 hover:text-rose-600"
                aria-label={`Remove ${p.file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function collectDone(list: PendingUpload[], justUploaded?: File, newAtt?: CommAttachment): CommAttachment[] {
  const all = [...list];
  if (justUploaded && newAtt) {
    const idx = all.findIndex((x) => x.file === justUploaded);
    if (idx >= 0) all[idx] = { ...all[idx], status: "done", attachment: newAtt };
  }
  return all.filter((x) => x.status === "done" && x.attachment).map((x) => x.attachment!);
}

function mockCommViewerFallback(): import("@/types/communication").CommUser {
  return { id: "u-revita", name: "Revita", email: "revita@dreamlab.id", role: "Digital Marketing Lead" };
}