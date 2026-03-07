import api from './api';

export interface LeadDTO {
  leadID: number;
  userID?: number;
  userName?: string;
  campaignID: number;
  campaignName?: string;
  leadStatus: string;
  leadScore: number;
  source?: string;
  notes?: string;
  createdDate: string;
  lastContactDate?: string;
  isArchived: boolean;
  archivedDate?: string;
  archivedByUserName?: string;
}

export interface CreateLeadDTO {
  campaignID: number;
  leadStatus: string;
  leadScore: number;
  source?: string;
  notes?: string;
  userID?: number;
}

export interface UpdateLeadDTO {
  leadStatus: string;
  leadScore: number;
  notes?: string;
  source?: string;
  lastContactDate?: string;
}

const leadService = {
  getLeads: async (params?: { status?: string; source?: string; search?: string; showArchived?: boolean }): Promise<LeadDTO[]> => {
    const response = await api.get<LeadDTO[]>('/leads', { params });
    return response.data;
  },

  getLead: async (id: number): Promise<LeadDTO> => {
    const response = await api.get<LeadDTO>(`/leads/${id}`);
    return response.data;
  },

  createLead: async (lead: CreateLeadDTO): Promise<LeadDTO> => {
    const response = await api.post<LeadDTO>('/leads', lead);
    return response.data;
  },

  updateLead: async (id: number, lead: UpdateLeadDTO): Promise<void> => {
    await api.put(`/leads/${id}`, lead);
  },

  deleteLead: async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  archiveLead: async (id: number): Promise<void> => {
    await api.patch(`/leads/${id}/archive`);
  },

  restoreLead: async (id: number): Promise<void> => {
    await api.patch(`/leads/${id}/restore`);
  },
};

export default leadService;
