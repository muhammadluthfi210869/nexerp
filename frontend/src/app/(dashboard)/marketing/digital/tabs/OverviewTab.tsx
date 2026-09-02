'use client';

import type { MarketingOverview } from '@/types/marketing-overview';
import { ExecutiveFunnelOverview } from '../components/ExecutiveFunnelOverview';

export function OverviewTab({ data }: { data: MarketingOverview }) {
  return (
    <div data-marketing-page="digital">
      <ExecutiveFunnelOverview data={data} />
    </div>
  );
}
