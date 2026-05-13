import api from './api';

export interface LoginDTO {
  email: string;
  password: string;
  recaptchaToken: string;
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

export interface LoginChallengeResponse {
  requiresTwoFactor: boolean;
  email: string;
  maskedEmail: string;
  message: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordWithOtpDTO {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const authService = {
  login: async (credentials: LoginDTO): Promise<LoginChallengeResponse> => {
    const response = await api.post<LoginChallengeResponse>('/auth/login', credentials);
    return response.data;
  },

  verifyLoginOtp: async (data: { email: string; otp: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-login-otp', data);
    return response.data;
  },

  resendLoginOtp: async (data: ForgotPasswordDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/resend-login-otp', data);
    return response.data;
  },

  register: async (data: RegisterDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordWithOtpDTO): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },
};

export default authService;
