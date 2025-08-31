import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Menu, BarChart, Users, Package, Shield, User, LogOut, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user has superadmin role for admin management access
  const isSuperAdmin = user?.role === 'superadmin';

  // Update CSS custom property when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--admin-sidebar-width', 
      isSidebarCollapsed ? '4rem' : '16rem'
    );
  }, [isSidebarCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle mobile menu backdrop click
  const handleBackdropClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const allNavItems = [
    { path: '/admin/products', label: 'สินค้า', icon: Package, color: 'text-green-600', permission: 'products' },
    { path: '/admin/users', label: 'ผู้ใช้', icon: Users, color: 'text-purple-600', permission: 'users' },
    { path: '/admin/referral-codes', label: 'OTP สมัคร', icon: Users, color: 'text-teal-600', permission: 'referrals' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, color: 'text-indigo-600', permission: 'audit' },
  ];

  // Define types for nav items
  type NavItem = {
    path: string;
    label: string;
    icon: any;
    color: string;
    permission?: string;
  };

  // Admin management item is available to superadmins
const adminManagementItem: NavItem = 
    { path: '/admin/admin-management', label: 'ผู้ดูแลระบบ', icon: Shield, color: 'text-red-600' };

  // Filter nav items based on permissions
  const getVisibleNavItems = (): NavItem[] => {
    let items: NavItem[] = allNavItems.filter(item => {
      const hasAccess = !item.permission || isSuperAdmin || hasPermission(item.permission);
      return hasAccess;
    });
    
    // Add admin management for superadmins
    if (isSuperAdmin) {
      items = [...items, adminManagementItem];
    }
    
    return items;
  };

  const currentNavItems = getVisibleNavItems();

  // Admin navbar - always show admin interface
  return (
      <>
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Panel
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={handleBackdropClick}
          />
        )}

        {/* Mobile Slide-out Menu */}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                Admin Panel
              </h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Mobile Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              if (!Icon) return null;
              
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mr-3 ${
                    active ? item.color : 'text-gray-500'
                  } transition-colors duration-200`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Profile Section */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.phone}</p>
                <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 mr-3" />
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 bg-white shadow-xl border-r border-gray-100 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Modern Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Admin Panel
                </h1>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-white/60 transition-all duration-200 focus-ring"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Modern Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            {currentNavItems.map((item) => {
              // Handle dividers for SuperAdmin
              if (item.path === 'divider') {
                return (
                  <div key={item.path} className="py-2">
                    <div className="border-t border-gray-200 my-2"></div>
                    {!isSidebarCollapsed && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                        {item.label}
                      </p>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              if (!Icon) return null;
              
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item group relative ${
                    active
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${
                    active ? item.color : 'text-gray-500 group-hover:text-gray-700'
                  } transition-colors duration-200`} />
                  {!isSidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {active && (
                    <div className="absolute right-0 w-1 h-8 bg-blue-600 rounded-l-full"></div>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Modern User Profile Section */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.phone}</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <button
                onClick={handleLogout}
                className={`nav-item w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut className={`w-5 h-5 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
                {!isSidebarCollapsed && 'ออกจากระบบ'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
};

export default Navbar;