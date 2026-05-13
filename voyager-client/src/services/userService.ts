import api from './api';

export interface UserDTO {
  id: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountStatus: string;
  createdDate: string;
}

export interface CreateUserDTO {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
}

export interface AuditLogDTO {
  id: number;
  userName: string;
  email: string;
  action: string;
  module: string;
  ipAddress: string;
  timestamp: string;
  details: string;
}

const userService = {
  getUsers: async (): Promise<UserDTO[]> => {
    const response = await api.get<UserDTO[]>('/users');
    return response.data;
  },
  createUser: async (dto: CreateUserDTO): Promise<UserDTO> => {
    const response = await api.post<UserDTO>('/users', dto);
    return response.data;
  },
  updateRole: async (id: number, role: string): Promise<void> => {
    await api.patch(`/users/${id}/role`, { role });
  },
  updateStatus: async (id: number, status: string): Promise<void> => {
    await api.patch(`/users/${id}/status`, { status });
  },
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  getAuditLogs: async (): Promise<AuditLogDTO[]> => {
    const response = await api.get<AuditLogDTO[]>('/users/audit-logs');
    return response.data;
  },
};

export default userService;
