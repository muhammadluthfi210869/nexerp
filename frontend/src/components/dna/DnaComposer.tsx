"use client";

// DnaComposer — reply composer with @mention autocomplete + file attach.
//
// ponytail: Cmd/Ctrl+Enter to submit. Single textarea — markdown shortcuts
// (bold/italic/code) intentionally skipped (DnaInternalThread renders plain
// text). Add when brief asks for it.

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Flame, AlertTriangle } from "lucide-react";
import { DnaTextarea } from "@/components/dna/DnaTextarea";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaMention } from "@/components/dna/DnaMention";
import { DnaAttach } from "@/components/dna/DnaAttach";
import { useDnaToast } from "@/components/dna/DnaToast";
import { communicationService } from "@/lib/services/communication-service";
import type { CommAttachment, CommReply, CommUser, ReplyUrgency } from "@/types/communication";

export interface DnaComposerProps {
  threadId: string;
  viewer: CommUser;
  parentReplyId?: string | null;
  onReplyCreated: (reply: CommReply) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function DnaComposer({
  threadId,
  viewer,
  parentReplyId,
  onReplyCreated,
  className,
  placeholder = "Tulis balasan… (gunakan @ untuk mention, Cmd/Ctrl+Enter untuk kirim)",
  autoFocus,
}: DnaComposerProps) {
  const toast = useDnaToast();
  const [body, setBody] = useState("");
  const [urgency, setUrgency] = useState<ReplyUrgency>("NORMAL");
  const [attachments, setAttachments] = useState<CommAttachment[]>([]);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onBodyChange = useCallback(
    (next: string, mentioned?: CommUser) => {
      setBody(next);
      if (mentioned) {
        setMentionIds((prev) => (prev.includes(mentioned.id) ? prev : [...prev, mentioned.id]));
      }
    },
    [],
  );

  const submit = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const reply = await communicationService.createReply(viewer, threadId, {
        body: trimmed,
        urgency,
        mentionIds,
        attachmentIds: attachments.map((a) => a.id),
        parentReplyId: parentReplyId ?? null,
      });
      onReplyCreated(reply);
      setBody("");
      setMentionIds([]);
      setAttachments([]);
      setUrgency("NORMAL");
      toast.success("Balasan terkirim");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal mengirim";
      toast.error("Gagal mengirim", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }, [body, urgency, mentionIds, attachments, parentReplyId, viewer, threadId, onReplyCreated, toast]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionPickerOpen) return; // DnaMention handles it
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  // Auto-focus once on mount if requested
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className={cn("space-y-2 border-t border-slate-200 pt-3", className)}>
      <div className="relative">
        <DnaMention value={body} onChange={onBodyChange} onPickerStateChange={setMentionPickerOpen} />
        <DnaTextarea
          ref={textareaRef}
          rows={3}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <DnaAttach onChange={setAttachments} />
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Urgensi:</span>
            {(["NORMAL", "PENTING", "URGENT"] as const).map((lvl) => {
              const active = urgency === lvl;
              return (
                <DnaButton
                  key={lvl}
                  variant={active ? (lvl === "URGENT" ? "danger" : "primary") : "outline"}
                  size="sm"
                  className="h-6 px-2 text-[10px] font-semibold"
                  onClick={() => setUrgency(lvl)}
                  type="button"
                >
                  {lvl === "URGENT" && <Flame className="w-3 h-3 mr-1" />}
                  {lvl === "PENTING" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {lvl}
                </DnaButton>
              );
            })}
          </div>
        </div>
        <DnaButton
          type="button"
          variant="primary"
          size="sm"
          onClick={submit}
          loading={submitting}
          disabled={!body.trim()}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          Kirim
        </DnaButton>
      </div>
    </div>
  );
}