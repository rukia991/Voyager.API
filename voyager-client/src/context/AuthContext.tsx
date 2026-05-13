import React, { useEffect, useState, type ReactNode } from 'react';
import { normalizeRole } from '../services/rbac';
import { AuthContext, type User } from './authContextStore';

const STORAGE_KEY = 'voyager_user';
const IDLE_TIMEOUT_MS = 12 * 60 * 1000;
const MAX_SESSION_MS = 24 * 60 * 60 * 1000;

const stampUserSession = (userData: User): User => {
  const nowIso = new Date().toISOString();
  return {
    ...userData,
    role: normalizeRole(userData.role) ?? userData.role,
    sessionStartedAt: userData.sessionStartedAt ?? nowIso,
    lastActivityAt: nowIso,
  };
};

const loadStoredUser = () => {
  const savedUser = localStorage.getItem(STORAGE_KEY);
  if (!savedUser) {
    return null;
  }

  try {
    const parsedUser = stampUserSession(JSON.parse(savedUser) as User);
    const now = Date.now();
    const expiryMs = new Date(parsedUser.expiry).getTime();
    const sessionStartedAtMs = new Date(parsedUser.sessionStartedAt ?? parsedUser.expiry).getTime();
    const lastActivityAtMs = new Date(parsedUser.lastActivityAt ?? parsedUser.expiry).getTime();

    if (
      expiryMs > now &&
      now - sessionStartedAtMs <= MAX_SESSION_MS &&
      now - lastActivityAtMs <= IDLE_TIMEOUT_MS
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser));
      return parsedUser;
    }

    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to parse saved user', error);
    localStorage.removeItem(STORAGE_KEY);
  }

  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const loading = false;

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const recordActivity = () => {
      setUser((prev) => {
        if (!prev) {
          return prev;
        }

        const next = { ...prev, lastActivityAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll'];
    events.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      setUser((prev) => {
        if (!prev) {
          return prev;
        }

        const now = Date.now();
        const expiryMs = new Date(prev.expiry).getTime();
        const sessionStartedAtMs = new Date(prev.sessionStartedAt ?? prev.expiry).getTime();
        const lastActivityAtMs = new Date(prev.lastActivityAt ?? prev.expiry).getTime();

        if (
          expiryMs <= now ||
          now - sessionStartedAtMs > MAX_SESSION_MS ||
          now - lastActivityAtMs > IDLE_TIMEOUT_MS
        ) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        return prev;
      });
    }, 30000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.clearInterval(intervalId);
    };
  }, [user]);

  const login = (userData: User) => {
    const sessionUser = stampUserSession(userData);
    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      const next = stampUserSession({ ...prev, ...updates });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
