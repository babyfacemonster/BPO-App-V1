import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { db } from './db';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    db.init();
    const stored = localStorage.getItem('serenity_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const u = await db.login(email);
    if (u) {
      setUser(u);
      localStorage.setItem('serenity_user', JSON.stringify(u));
    } else {
      alert('User not found in mock DB. Try candidate@demo.com, company@demo.com, or admin@serenity.com');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('serenity_user');
    window.location.hash = '/';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}