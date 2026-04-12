import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setTokenCache } from '../api';

export interface User {
  id: number;
  email: string;
  name: string;
  is_premium: boolean;
  height_cm?: number | null;
  weight_kg?: number | null;
  gender?: string | null;
  stats?: { total_workouts: number; streak: number; total_plans: number };
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('kyroo_token');
        if (stored) {
          const profile = await api.profile.get(stored);
          setToken(stored);
          setUser(profile);
        }
      } catch {
        await AsyncStorage.removeItem('kyroo_token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    setTokenCache(newToken);
    await AsyncStorage.setItem('kyroo_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    setTokenCache(null);
    await AsyncStorage.removeItem('kyroo_token');
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, token, isLoading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
