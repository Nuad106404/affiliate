import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  phone: string;
  role: 'client' | 'admin' | 'superadmin';
  status?: string;
  avatar?: string;
  bio?: string;
  credits?: number;
  referralCode?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  loading: boolean;
  error: string;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token with backend
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Only set user if they have admin privileges
            if (userData.role === 'admin' || userData.role === 'superadmin') {
              setUser(userData);
            } else {
              localStorage.removeItem('token');
            }
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const response = await authAPI.login({ phone, password });
      const data = response.data;
      console.log('Auth response:', data); // Debug log

      // Check the success flag from the backend
      if (!data.success) {
        const errorMessage = data.message || 'Login failed';
        console.log('Login error:', errorMessage); // Debug log
        setError(errorMessage);
        setLoading(false);
        return { success: false, message: errorMessage };
      }

      const { user, token } = data;
      
      // Only allow admin and superadmin roles
      if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        const errorMessage = 'Access denied. Admin privileges required.';
        setError(errorMessage);
        setLoading(false);
        return { success: false, message: errorMessage };
      }

      // Successful login
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      setError(''); // Clear any errors
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Login exception:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};