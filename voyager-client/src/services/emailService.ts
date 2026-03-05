import api from './api';

export interface EmailTemplateDTO {
  templateID: number;
  templateName: string;
  subject: string;
  body: string;
  isApproved: string;
  createdBy: number;
  creatorName?: string;
  createdDate: string;
}

export interface CreateEmailTemplateDTO {
  templateName: string;
  subject: string;
  body: string;
}

export interface EmailLogDTO {
  emailLogID: number;
  campaignName?: string;
  leadName?: string;
  templateName?: string;
  sentByName?: string;
  sentDate: string;
  status: string;
}

export interface BulkSendDTO {
  campaignID: number;
  templateID: number;
  leadIDs: number[];
}

const emailService = {
  getTemplates: async (): Promise<EmailTemplateDTO[]> => {
    const response = await api.get<EmailTemplateDTO[]>('/emailtemplates');
    return response.data;
  },

  createTemplate: async (template: CreateEmailTemplateDTO): Promise<EmailTemplateDTO> => {
    const response = await api.post<EmailTemplateDTO>('/emailtemplates', template);
    return response.data;
  },

  approveTemplate: async (id: number, status: string): Promise<void> => {
    await api.patch(`/emailtemplates/${id}/approve`, { status });
  },

  getLogs: async (): Promise<EmailLogDTO[]> => {
    const response = await api.get<EmailLogDTO[]>('/emaillogs');
    return response.data;
  },

  bulkSend: async (data: { campaignID: number; templateID: number; leadIDs: number[] }): Promise<void> => {
    await api.post('/emaillogs/bulk-send', data);
  }
};

export default emailService;
