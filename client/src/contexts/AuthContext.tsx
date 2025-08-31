import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'client';
  status?: 'active' | 'inactive';
  banMessage?: string;
  credits?: number;
  avatar?: string;
  bio?: string;
  website?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountOwnerName: string;
  };
  accountBalance?: number;
  totalEarned?: number;
  todayEarnings?: number;
  weekEarnings?: number;
  totalPurchases?: number;
  engagementMetrics?: {
    visitors: number;
    likes: number;
    followers: number;
  };
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
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

  // Function to refresh user data
  const refreshUserData = async () => {
    const token = localStorage.getItem('token');
    if (token && user) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      authAPI.getCurrentUser()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Real-time status checking - refresh user data every 30 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        refreshUserData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (phone: string, password: string) => {
    try {
      const response = await authAPI.login({ phone, password });
      const { user, token, pendingNotifications } = response.data;
      
      setUser(user);
      localStorage.setItem('token', token);
      
      // Show pending notifications if any
      if (pendingNotifications && pendingNotifications.length > 0) {
        // Import Swal dynamically to avoid dependency issues
        const Swal = (await import('sweetalert2')).default;
        
        for (const notification of pendingNotifications) {
          await Swal.fire({
            html: `
              <div style="text-align: center; padding: 20px;">
                <div style="background: #6366f1; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <div style="background: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #6366f1; font-size: 24px; font-weight: bold;">!</span>
                  </div>
                </div>
                <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">แจ้งเตือน</h2>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0; color: #374151; font-size: 16px;">${notification.message}</p>
                </div>
              </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'รับทราบ',
            confirmButtonColor: '#6366f1',
            customClass: {
              popup: 'rounded-3xl',
              confirmButton: 'rounded-2xl px-8 py-3'
            },
            showCloseButton: false,
            allowOutsideClick: false
          });
        }
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      setUser(user);
      localStorage.setItem('token', token);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};