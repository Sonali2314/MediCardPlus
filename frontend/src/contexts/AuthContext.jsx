import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch current user data
  const fetchUserData = async () => {
  try {
    const response = await api.get('/auth/me');
    setCurrentUser(response.data.data.user);
    setUserProfile(response.data.data.profile);
    setUserRole(response.data.data.user.role);
    setError(null);
    return response.data.data.user; // 👈 return user object
  } catch (err) {
    console.error('Error fetching user data:', err);
    logout();
    setError('Session expired. Please login again.');
    return null; // 👈 prevent undefined behavior
  } finally {
    setLoading(false);
  }
};

  // Login function
  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { token } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // fetch user data and get role from there
      const userData = await fetchUserData(); // update fetchUserData to return user info

      return userData?.role;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to login. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      const { token, role } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data
      await fetchUserData();
      
      return role;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setUserProfile(null);
    setUserRole(null);
  };

  const value = {
    currentUser,
    userProfile,
    userRole,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: fetchUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};