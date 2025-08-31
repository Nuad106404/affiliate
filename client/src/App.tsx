import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage';
import ShopPage from './components/ShopPage';
import ProductPage from './components/ProductPage';
import ProfilePage from './components/ProfilePage';
import LivePage from './components/LivePage';
import Navbar from './components/common/Navbar';
// import BottomNav from './components/common/BottomNav';
import LoadingSpinner from './components/common/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace />} />
        <Route path="/shop" element={user ? <ShopPage /> : <Navigate to="/login" replace />} />
        <Route path="/product/:id" element={user ? <ProductPage /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/live" element={user ? <LivePage /> : <Navigate to="/login" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
      
      {/* {user && <BottomNav />} */}
    </div>
  );
};

export default App;