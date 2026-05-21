import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  role: string | null;
  fullName: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false, token: null, username: null, role: null, fullName: null,
  login: async () => {}, logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'));

  const isAuthenticated = !!token;

  const login = async (user: string, pass: string) => {
    const res = await authApi.login({ username: user, password: pass });
    const { token: t, username: u, role: r, fullName: fn } = res.data;
    setToken(t); setUsername(u); setRole(r); setFullName(fn);
    localStorage.setItem('token', t);
    localStorage.setItem('username', u);
    localStorage.setItem('role', r);
    localStorage.setItem('fullName', fn);
  };

  const logout = () => {
    setToken(null); setUsername(null); setRole(null); setFullName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, username, role, fullName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
