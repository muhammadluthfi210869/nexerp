import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardCards } from '@/components/bussdev/DashboardCards';

describe('DashboardCards', () => {
  const mockOverviewData = {
    overview: {
      totalLeads: 100,
      contactedLeads: 60,
      sampleProcess: 30,
      dpReceived: 15,
      dealConfirmed: 8,
      repeatOrder: 3,
      contactRate: '60.0%',
      sampleRate: '50.0%',
      dpRate: '50.0%',
      dealRate: '53.3%',
      retentionRate: '3.0%',
    },
    revenuePipeline: {
      totalPipelineValue: 5000000000,
      potentialSample: 2000000000,
      potentialDeal: 2500000000,
      confirmedDeal: 1000000000,
      repeatOrderValue: 500000000,
    },
    activityPerformance: {
      followUpToday: 8,
      avgResponse: 30,
      activeLeads: 80,
    },
    criticalAlerts: {
      unfollowedLeads: 3,
      stuckSamples: 2,
      stuckNego: 1,
      atRiskClients: 0,
    },
    bdPerformance: [],
    lostChurn: [],
    activityStreams: [],
  };

  it('renders dashboard variant with all section cards', () => {
    render(<DashboardCards variant="dashboard" data={mockOverviewData} />);
    expect(screen.getByText(/Funnel Overview/i)).toBeInTheDocument();
  });

  it('renders null when data is not provided', () => {
    const { container } = render(<DashboardCards variant="dashboard" data={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders with guest variant data', () => {
    const guestData = { totalLeads: 50, increment: 5, followUpActivity: 10 };
    render(<DashboardCards variant="guest" data={guestData} />);
  });

  it('renders with sample variant data', () => {
    const sampleData = { activeSamples: 20, revenueForecast: 1000000000 };
    render(<DashboardCards variant="sample" data={sampleData} />);
  });

  it('renders with production variant data', () => {
    const prodData = { inProduction: 10, productionValue: 2000000000 };
    render(<DashboardCards variant="production" data={prodData} />);
  });

  it('renders with ro variant data', () => {
    const roData = { activeRoLeads: 5, roRevenue: 500000000 };
    render(<DashboardCards variant="ro" data={roData} />);
  });

  it('renders with lost variant data', () => {
    const lostData = { lostLeads: 15, lostValue: 750000000 };
    render(<DashboardCards variant="lost" data={lostData} />);
  });

  it('renders with pipeline variant data', () => {
    const pipelineData = { activeLeads: 60, pipelineValue: 3000000000 };
    render(<DashboardCards variant="pipeline" data={pipelineData} />);
  });
});
