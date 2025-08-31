import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Common Components
import { Login } from './components/Login';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Admin Components
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';
import ReferralCodeManagement from './components/ReferralCodeManagement';

// Admin Management Component for superadmin users
import AdminManagement from './components/AdminManagement';
// Audit Logs Component
import AuditLogs from './components/AuditLogs';

// Route Protection Components
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false
}) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Only allow admin and superadmin users
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="admin-content">
        <Routes>
          {
            // Regular Admin Routes
            <>
              <Route path="/admin/products" element={
                <ProtectedRoute adminOnly>
                  <ProductManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/referral-codes" element={
                <ProtectedRoute adminOnly>
                  <ReferralCodeManagement />
                </ProtectedRoute>
              } />
              {/* Admin Management route available only to superadmins */}
              {user?.role === 'superadmin' && (
                <Route path="/admin/admin-management" element={
                  <AdminManagement />
                } />
              )}
              {/* Audit Logs route available to all admin users */}
              <Route path="/admin/audit-logs" element={
                <ProtectedRoute adminOnly>
                  <AuditLogs />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/admin/products" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
            </>
          }
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
