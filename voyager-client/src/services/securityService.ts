import api from './api';

export interface SecurityAuditItemDTO {
  id: number;
  userId?: number | null;
  email: string;
  action: string;
  module: string;
  ipAddress: string;
  country: string;
  city: string;
  details: string;
  timestamp: string;
}

export interface LockedAccountDTO {
  userId: number;
  userName: string;
  email: string;
  failedAccessCount: number;
  lockoutEnd?: string | null;
  lastAttemptIpAddress: string;
  lastAttemptAt?: string | null;
}

export interface SecurityDashboardDTO {
  suspiciousLoginCount: number;
  failedLoginCount: number;
  lockedAccountCount: number;
  suspiciousLogins: SecurityAuditItemDTO[];
  failedAttempts: SecurityAuditItemDTO[];
  recentSuccessfulLogins: SecurityAuditItemDTO[];
  lockedAccounts: LockedAccountDTO[];
}

export interface UnlockAccountDTO {
  userId?: number;
  email?: string;
}

const securityService = {
  getDashboard: async (): Promise<SecurityDashboardDTO> => {
    const response = await api.get<SecurityDashboardDTO>('/security/dashboard');
    return response.data;
  },

  unlockAccount: async (payload: UnlockAccountDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/security/unlock-account', payload);
    return response.data;
  },

  getAuditDetail: async (id: number): Promise<SecurityAuditItemDTO> => {
    const response = await api.get<SecurityAuditItemDTO>(`/security/audit/${id}`);
    return response.data;
  },

  getLockedAccountDetail: async (userId: number): Promise<LockedAccountDTO> => {
    const response = await api.get<LockedAccountDTO>(`/security/locked-account/${userId}`);
    return response.data;
  },
};

export default securityService;
