import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ensure axios sends cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API || 'https://urlshortenerapp1-hdanbrangkbddxb0.westeurope-01.azurewebsites.net';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Try to fetch current user from backend
  async function refreshUser() {
    try {
      const res = await axios.get('/api/auth/me'); // requires backend route
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    // on mount, try to load user (will send cookies automatically)
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      toast.success('Logged out');
      navigate('/');
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}