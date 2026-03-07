import api from './api';

export interface CampaignDTO {
  campaignID: number;
  campaignName: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  targetGoal?: string;
  status: string;
  createdDate: string;
  createdBy: number;
  locationID: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  isArchived: boolean;
  archivedDate?: string;
  archivedByUserName?: string;
}

export interface CreateCampaignDTO {
  campaignName: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  targetGoal?: string;
  status: string;
  locationID: number;
}

const campaignService = {
  getCampaigns: async (params?: { status?: string; search?: string; showArchived?: boolean }): Promise<CampaignDTO[]> => {
    const response = await api.get<CampaignDTO[]>('/campaigns', { params });
    return response.data;
  },

  getCampaign: async (id: number): Promise<CampaignDTO> => {
    const response = await api.get<CampaignDTO>(`/campaigns/${id}`);
    return response.data;
  },

  createCampaign: async (campaign: CreateCampaignDTO): Promise<CampaignDTO> => {
    const response = await api.post<CampaignDTO>('/campaigns', campaign);
    return response.data;
  },

  updateCampaign: async (id: number, campaign: CreateCampaignDTO): Promise<void> => {
    await api.put(`/campaigns/${id}`, campaign);
  },

  archiveCampaign: async (id: number): Promise<void> => {
    await api.patch(`/campaigns/${id}/archive`);
  },

  restoreCampaign: async (id: number): Promise<void> => {
    await api.patch(`/campaigns/${id}/restore`);
  },

  deleteCampaign: async (id: number): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },
};

export default campaignService;
