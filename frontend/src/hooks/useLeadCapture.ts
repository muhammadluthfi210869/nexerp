import { useQuery } from '@tanstack/react-query';

export interface LeadCaptureRow {
  id: string;
  phone: string;
  waProfileName: string | null;
  extractedFullName: string | null;
  nameConfidence: number | null;
  nameMatch: boolean | null;
  approvalNeeded: boolean;
  aiIntent: string | null;
  aiStatus: string | null;
  workflowStatus: string;
  outboundReplyCount: number;
  assignedTo: string | null;
  firstValidatedAt: string | null;
  createdAt: string;
}

export function useLeadCapture(filter: 'all' | 'approval' | 'junk' = 'all') {
  return useQuery({
    queryKey: ['lead-capture', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'approval') params.set('approvalNeeded', 'true');
      if (filter === 'junk') params.set('aiIntent', 'JUNK');
      params.set('aiStatus', 'VALIDATED');
      const res = await fetch(`/api/v1/lead-capture?${params}`);
      const json = await res.json();
      return (json.data ?? []) as LeadCaptureRow[];
    },
    refetchInterval: 5000,
  });
}
