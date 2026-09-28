import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth, signOut } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/accounts/me/');
      setProfile(res.data);
      return res.data;
    } catch (err) {
      console.warn('Failed to fetch user profile:', err?.response?.data?.detail || err.message);
      setProfile(null);
      setError(err.response?.data?.detail || 'Authentication failed');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('bloodchain_token');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('bloodchain_token');
    if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
      fetchProfile().catch(() => {});
    } else {
      localStorage.removeItem('bloodchain_token');
      setLoading(false);
    }
  }, []);

  const loginWithDevToken = async (devToken) => {
    if (!devToken || devToken === 'null' || devToken === 'undefined') {
      throw new Error('Invalid authentication token');
    }
    localStorage.setItem('bloodchain_token', devToken);
    return await fetchProfile();
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.debug('Firebase signOut note:', e);
    }
    localStorage.removeItem('bloodchain_token');
    setProfile(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        user: profile,
        facility: profile?.facility,
        role: profile?.role,
        loading,
        error,
        loginWithDevToken,
        logout,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
