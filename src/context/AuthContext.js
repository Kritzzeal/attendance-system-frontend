// src/context/AuthContext.jsx - FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      const profile = await authService.getProfile();
      return profile;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      return null;
    }
  };

  // Initialize auth state
  const initAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token) {
      try {
        // If we have token but no user data, fetch profile
        if (!savedUser) {
          const profile = await fetchUserProfile();
          if (profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } else {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      // 1. Login to get token
      const loginResponse = await authService.login({ email, password });
      
      if (loginResponse.access_token) {
        // Store token
        localStorage.setItem('token', loginResponse.access_token);
        
        // 2. Fetch user profile
        const profile = await fetchUserProfile();
        
        if (!profile) {
          throw new Error('Failed to fetch user profile');
        }
        
        // 3. Store user data
        const userData = {
          email: email,
          id: profile.id,
          name: profile.name || email.split('@')[0],
          role: profile.role || 'teacher',
          teacher_id: profile.teacher_id
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.teacher_id) {
          localStorage.setItem('teacher_id', userData.teacher_id);
        }
        
        return { success: true, user: userData };
      } else {
        setError('No access token received');
        return { success: false, error: 'No access token received' };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    // Call logout API
    authService.logout().catch(err => console.error('Logout error:', err));
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('teacher_id');
    
    // Clear state
    setUser(null);
    
    // Redirect to login
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user && !!localStorage.getItem('token'),
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};