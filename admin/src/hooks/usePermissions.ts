import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // SuperAdmin has all permissions
    if (user.role === 'superadmin') return true;
    
    // Check if user has the specific permission
    return user.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    
    // SuperAdmin has all permissions
    if (user.role === 'superadmin') return true;
    
    // Check if user has at least one of the permissions
    return permissions.some(permission => user.permissions?.includes(permission)) || false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    
    // SuperAdmin has all permissions
    if (user.role === 'superadmin') return true;
    
    // Check if user has all permissions
    return permissions.every(permission => user.permissions?.includes(permission)) || false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'superadmin' || false;
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === 'superadmin' || false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    permissions: user?.permissions || [],
    role: user?.role
  };
};
