import api from './api';

export interface WorkflowRuleDTO {
  ruleID: number;
  ruleName: string;
  triggerEvent: string;
  condition?: string;
  action?: string;
  isActive: boolean;
  createdDate: string;
}

export interface CreateWorkflowRuleDTO {
  ruleName: string;
  triggerEvent: string;
  condition?: string;
  action?: string;
  isActive: boolean;
}

export interface IntegrationSettingsDTO {
  mapboxAccessToken: string;
  emailSmtpHost: string;
  emailSmtpPort: number;
  emailSender: string;
}

const automationService = {
  getRules: async (): Promise<WorkflowRuleDTO[]> => {
    const response = await api.get<WorkflowRuleDTO[]>('/workflowrules');
    return response.data;
  },

  createRule: async (rule: CreateWorkflowRuleDTO): Promise<WorkflowRuleDTO> => {
    const response = await api.post<WorkflowRuleDTO>('/workflowrules', rule);
    return response.data;
  },

  toggleRule: async (id: number): Promise<void> => {
    await api.patch(`/workflowrules/${id}/toggle`);
  },

  deleteRule: async (id: number): Promise<void> => {
    await api.delete(`/workflowrules/${id}`);
  },

  getSettings: async (): Promise<IntegrationSettingsDTO> => {
    const response = await api.get<IntegrationSettingsDTO>('/settings');
    return response.data;
  },

  downloadBackup: async (): Promise<void> => {
    const response = await api.get('/backup/download', {
      responseType: 'blob'
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Voyager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default automationService;
