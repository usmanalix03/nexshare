/**
 * context/AuthContext.jsx — JWT Authentication State
 * Provides auth state and helpers to all components via React Context.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nex_token'));
  const [loading, setLoading] = useState(true);

  // On mount: verify existing token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('nex_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setToken(storedToken);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('nex_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  /**
   * Store the token from login/register and decode user info.
   * @param {string} newToken - JWT from backend
   * @param {Object} userData - User object from backend response
   */
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('nex_token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  /** Clear all auth state and redirect to home */
  const logout = useCallback(() => {
    localStorage.removeItem('nex_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook — use inside any component to access auth state */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
