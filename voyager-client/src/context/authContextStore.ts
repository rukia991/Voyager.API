import { createContext } from 'react';

export interface User {
  userName: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  role: string;
  token: string;
  expiry: string;
  sessionStartedAt?: string;
  lastActivityAt?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
