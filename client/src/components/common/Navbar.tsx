import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Home, ShoppingBag, Settings, Video } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Shopify-Style Client Header - Desktop */}
      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Shopify-Style Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-700 transition-colors duration-200 shadow-sm">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                MarketPlace
              </span>
            </Link>

            {/* Shopify-Style Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`relative py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive('/') 
                    ? 'text-green-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-600' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                หน้าแรก
              </Link>
              <Link
                to="/shop"
                className={`relative py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive('/shop') 
                    ? 'text-green-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-600' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                ร้านค้า
              </Link>
              <Link
                to="/live"
                className={`relative py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive('/live') 
                    ? 'text-green-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-600' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Live
              </Link>
            </div>

            {/* Shopify-Style User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {user?.avatar && user.avatar !== '/default-avatar.svg' ? (
                    <img
                      src={user.avatar.startsWith('/uploads/') 
                        ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${user.avatar}` 
                        : user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                </div>
              </div>
              
              <Link
                to="/profile"
                className="p-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Shopify-Style Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb shadow-lg">
        <div className="flex items-center justify-around py-3 px-4">
          <Link
            to="/"
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
              isActive('/') 
                ? 'text-green-600 bg-green-50 scale-105' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 active:scale-95'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">หน้าแรก</span>
          </Link>
          
          <Link
            to="/shop"
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
              isActive('/shop') 
                ? 'text-green-600 bg-green-50 scale-105' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 active:scale-95'
            }`}
          >
            <ShoppingBag className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">ร้านค้า</span>
          </Link>

          <Link
            to="/live"
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
              isActive('/live') 
                ? 'text-green-600 bg-green-50 scale-105' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 active:scale-95'
            }`}
          >
            <Video className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Live</span>
          </Link>
          
          
          <Link
            to="/profile"
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
              isActive('/profile') 
                ? 'text-green-600 bg-green-50 scale-105' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 active:scale-95'
            }`}
          >
            <div className="w-6 h-6 mb-1 rounded-full overflow-hidden">
              {user?.avatar && user.avatar !== '/default-avatar.svg' ? (
                <img
                  src={user.avatar.startsWith('/uploads/') 
                    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${user.avatar}` 
                    : user.avatar}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.svg';
                  }}
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <span className="text-xs font-medium">โปรไฟล์</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;