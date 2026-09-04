'use client';

import { useState } from 'react';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { LeadCaptureTable } from '@/components/marketing/omni-crm/LeadCaptureTable';
import { Inbox, AlertTriangle, Trash2 } from 'lucide-react';

export default function LeadCapturePage() {
  const [filter, setFilter] = useState<'all' | 'approval' | 'junk'>('all');
  const { data: leads, isLoading } = useLeadCapture(filter);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Inbox className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold">Lead Capture — Validated Inbox</h1>
      </div>

      <div className="flex gap-2">
        {(['all', 'approval', 'junk'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f === 'all' && <Inbox className="w-4 h-4 inline mr-1.5" />}
            {f === 'approval' && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
            {f === 'junk' && <Trash2 className="w-4 h-4 inline mr-1.5" />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-400 py-8 text-center">Loading...</div>
      ) : (
        <LeadCaptureTable leads={leads ?? []} />
      )}
    </div>
  );
}
