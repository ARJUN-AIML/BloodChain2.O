import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setProfile(null);
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('bloodchain_token');
    if (storedToken) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithDevToken = async (devToken) => {
    localStorage.setItem('bloodchain_token', devToken);
    await fetchProfile();
  };

  const logout = () => {
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
