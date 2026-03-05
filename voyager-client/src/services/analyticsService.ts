import api from './api';

export interface DailyMetricDTO {
  date: string;
  leads: number;
  emailsSent: number;
  conversions: number;
}

export interface StatusDistributionDTO {
  status: string;
  count: number;
}

export interface AnalyticsSummaryDTO {
  totalLeads: number;
  emailsSent: number;
  conversions: number;
  totalROI: number;
  performanceOverTime: DailyMetricDTO[];
  leadStatusDistribution: StatusDistributionDTO[];
}

export interface CampaignMetricDTO {
  campaignName: string;
  engagementRate: number;
  conversionRate: number;
  costPerLead: number;
  revenue: number;
}

const analyticsService = {
  getSummary: async (): Promise<AnalyticsSummaryDTO> => {
    const response = await api.get<AnalyticsSummaryDTO>('/analytics/summary');
    return response.data;
  },

  getCampaignMetrics: async (): Promise<CampaignMetricDTO[]> => {
    const response = await api.get<CampaignMetricDTO[]>('/analytics/campaigns');
    return response.data;
  },
};

export default analyticsService;
