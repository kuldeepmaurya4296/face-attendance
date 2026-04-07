'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export type Role = 'Owner' | 'SuperAdmin' | 'Admin' | 'User';

export interface AdminPermissions {
  manage_personnel: boolean;
  approve_leaves: boolean;
  view_attendance: boolean;
  manage_settings: boolean;
  manage_holidays: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  designation?: string;
  employee_id?: string;
  roll_number?: string;
  class_name?: string;
  section?: string;
  company_id?: string;
  org_type?: 'Company' | 'Institute';
  admin_permissions?: AdminPermissions;
  branding?: {
    brand_name?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    text_color?: string;
    logo_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        // Async sync of the latest branding from the database
        if (parsedUser.company_id) {
          api.get(`/companies/${parsedUser.company_id}`).then(res => {
            if (res.data?.settings?.branding) {
              const updatedUser = { ...parsedUser, branding: res.data.settings.branding };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }).catch(err => {
            console.error('Failed to sync latest branding on load', err);
          });
        }
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
