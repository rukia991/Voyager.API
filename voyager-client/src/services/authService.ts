import api from './api';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  firstName: string;
  middleName?: string;
  lastName: string;
  userName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  role: string;
  expiry: string;
}

const authService = {
  login: async (credentials: LoginDTO): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/register', data);
    return response.data;
  },
};

export default authService;
