'use client';

import type { LeadCaptureRow } from '@/hooks/useLeadCapture';
import { Check, AlertTriangle, X } from 'lucide-react';

interface Props {
  leads: LeadCaptureRow[];
  onApprove?: (lead: LeadCaptureRow, name: string) => void;
}

export function LeadCaptureTable({ leads, onApprove }: Props) {
  if (!leads.length) {
    return <div className="text-gray-500 italic py-8 text-center">No leads match this filter.</div>;
  }

  return (
    <div className="space-y-3">
      {leads.map(lead => (
        <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm text-gray-400">{lead.phone}</span>
                <span className="text-gray-600">•</span>
                <span className="font-medium">{lead.extractedFullName ?? lead.waProfileName ?? '—'}</span>
                <span className="text-gray-600">•</span>
                {lead.approvalNeeded ? (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm">
                    <AlertTriangle className="w-3 h-3" /> needs approval
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <Check className="w-3 h-3" /> validated
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-400 flex gap-4 flex-wrap">
                <span>waProfile: {lead.waProfileName ?? '—'}</span>
                <span>extracted: {lead.extractedFullName ?? '—'}</span>
                <span>
                  nameMatch:{' '}
                  {lead.nameMatch === true ? '✅' : lead.nameMatch === false ? '⚠️' : '—'}
                </span>
                <span>intent: {lead.aiIntent ?? '—'}</span>
                <span>assigned: {lead.assignedTo ?? '—'}</span>
                <span>status: {lead.workflowStatus}</span>
                <span>replies: {lead.outboundReplyCount}</span>
              </div>

              {lead.approvalNeeded && (
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Approve name..."
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm flex-1"
                    id={`approve-${lead.id}`}
                  />
                  <button
                    className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1 rounded text-sm"
                    onClick={() => {
                      const input = document.getElementById(`approve-${lead.id}`) as HTMLInputElement;
                      if (input?.value && onApprove) onApprove(lead, input.value);
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button className="text-cyan-400 hover:text-cyan-300 text-sm">View</button>
              <button className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                <X className="w-3 h-3" /> Junk
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
