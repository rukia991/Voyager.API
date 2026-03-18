import api from './api';

export interface TenantDTO {
  tenantId: number;
  companyName: string;
  subscriptionPlan: string;
  isActive: boolean;
  createdDate: string;
}

export const tenantService = {
  getTenants: async (): Promise<TenantDTO[]> => {
    const response = await api.get('/tenants');
    return response.data;
  },

  toggleTenantStatus: async (id: number): Promise<TenantDTO> => {
    const response = await api.post(`/tenants/${id}/toggle-status`);
    return response.data.tenant;
  },

  updateTenantPlan: async (id: number, plan: string): Promise<TenantDTO> => {
    const response = await api.post(`/tenants/${id}/plan`, { plan });
    return response.data.tenant;
  }
};

export default tenantService;
