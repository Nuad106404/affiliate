import React, { useState, useEffect } from 'react';
import { User, ShoppingBag, Settings, Camera, Eye, Heart, Users, Package, DollarSign, Star, EyeOff, Calendar, CreditCard, ArrowUpRight, CheckCircle, Clock, XCircle, AlertTriangle, Wallet, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { affiliateProductsAPI, usersAPI, authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Modal from './common/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import Swal from 'sweetalert2';

interface ProfileData {
  personalInfo: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    bankDetails: {
      accountNumber: string;
      bankName: string;
      accountOwnerName: string;
    };
    phone: string;
    avatar: string;
  };
  stats: {
    profileViews: number;
    likes: number;
    followers: number;
    joinDate: string;
  };
  activity: {
    totalPurchases: number;
    creditsEarned: number;
    accountBalance: number;
    affiliateEarnings: number;
  };
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliate' | 'Withdraw' | 'settings'>('overview');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [affiliateProducts, setAffiliateProducts] = useState<any[]>([]);
  const [affiliateStats, setAffiliateStats] = useState({ totalProducts: 0, totalEarnings: '0.00' });
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  useEffect(() => {
    if (activeTab === 'Withdraw') {
      fetchWithdrawalHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProfileData();
    fetchAffiliateData();
  }, []);

  useEffect(() => {
    if (activeTab === 'affiliate') {
      fetchAffiliateData();
    }
  }, [activeTab]);


  const fetchAffiliateData = async () => {
    try {
      setAffiliateLoading(true);
      const [productsResponse, statsResponse] = await Promise.all([
        affiliateProductsAPI.getAll(),
        affiliateProductsAPI.getStats()
      ]);
      
      setAffiliateProducts(productsResponse.data.products || []);
      setAffiliateStats({
        totalProducts: statsResponse.data.totalProducts || 0,
        totalEarnings: statsResponse.data.totalEarnings || '0.00'
      });
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setAffiliateLoading(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      setWithdrawalLoading(true);
      console.log('Fetching withdrawal history...');
      const response = await usersAPI.getWithdrawals();
      console.log('Withdrawal history response:', response.data);
      setWithdrawalHistory(response.data.withdrawals || []);
    } catch (error: any) {
      console.error('Error fetching withdrawal history:', error);
      console.error('Error details:', error.response?.data);
      // If it's a 403 or auth error, don't show error to user - just show empty state
      if (error.response?.status === 403 || error.response?.status === 401) {
        setWithdrawalHistory([]);
      } else {
        // For other errors, still set empty array but log the error
        setWithdrawalHistory([]);
      }
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleRemoveAffiliateProduct = async (affiliateProductId: string) => {
    try {
      await affiliateProductsAPI.remove(affiliateProductId);
      // Refresh the data
      fetchAffiliateData();
    } catch (error) {
      console.error('Error removing affiliate product:', error);
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize profile data with user data
    setProfileData({
      personalInfo: {
        name: user?.name || 'ชื่อผู้ใช้',
        address: {
          street: user?.address?.street || '',
          city: user?.address?.city || '',
          state: user?.address?.state || '',
          zipCode: user?.address?.zipCode || '',
          country: user?.address?.country || ''
        },
        bankDetails: user?.bankDetails || {
          accountNumber: '',
          bankName: '',
          accountOwnerName: ''
        },
        phone: user?.phone || 'ไม่ได้ระบุหมายเลขโทรศัพท์',
        avatar: user?.avatar || '/default-avatar.svg'
      },
      stats: {
        profileViews: user?.engagementMetrics?.visitors || 0,
        likes: user?.engagementMetrics?.likes || 0,
        followers: user?.engagementMetrics?.followers || 0,
        joinDate: user?.createdAt || new Date().toISOString()
      },
      activity: {
        totalPurchases: user?.totalPurchases || 110,
        creditsEarned: user?.credits || 100,
        accountBalance: user?.accountBalance || 0,
        affiliateEarnings: user?.totalEarned || 5000
      }
    });

    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if user already has an avatar (can only upload once)
    if (user?.avatar && user.avatar !== '/default-avatar.svg') {
      alert('คุณสามารถอัปโหลดรูปโปรไฟล์ได้เพียงครั้งเดียว');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องน้อยกว่า 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Update profile data with new avatar - no need to update since we're using user.avatar directly
        alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('ไม่สามารถอัปโหลดรูปโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    
    // Real-time status check - fetch latest user data
    try {
      const response = await authAPI.getCurrentUser();
      const currentUser = response.data;
      
      if (currentUser.status === 'inactive') {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: currentUser.banMessage,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Fallback to cached user status
      if (user?.status === 'inactive') {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: user?.banMessage,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
    }
    
    const amount = parseFloat(withdrawAmount);
    const currentBalance = profileData?.activity.accountBalance || 0;
    
    // Validation
    if (!amount || amount <= 0) {
      setWithdrawError('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    if (amount > currentBalance) {
      setWithdrawError('ยอดเงินไม่เพียงพอ');
      return;
    }
    
    if (!profileData?.personalInfo.bankDetails.accountNumber) {
      setWithdrawError('กรุณาเพิ่มรายละเอียดธนาคารก่อน');
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      const response = await usersAPI.withdraw(amount);
      
      // Update local balance
      setProfileData(prev => prev ? {
        ...prev,
        activity: {
          ...prev.activity,
          accountBalance: prev.activity.accountBalance - amount
        }
      } : null);
      
      setWithdrawAmount('');
      
      // Refresh withdrawal history
      fetchWithdrawalHistory();
      
      Swal.fire({
        title: 'ถอนเงินสำเร็จ!',
        text: `ขอถอนเงินจำนวน $${amount.toFixed(2)} สำเร็จแล้ว`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setWithdrawError(error.response?.data?.message || 'เกิดข้อผิดพลาดทางเครือข่าย กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Shopify-Style Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 lg:mb-8">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-green-500 to-green-600"></div>
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0">
                <img
                  src={user?.avatar?.startsWith('/uploads/') 
                    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${user.avatar}` 
                    : user?.avatar || '/default-avatar.svg'}
                  alt={profileData.personalInfo.name}
                  className="w-full h-full rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.svg';
                  }}
                />
                {(!user?.avatar || user.avatar === '/default-avatar.svg') && (
                  <label className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="pb-4 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profileData.personalInfo.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  สมาชิกตั้งแต่ {new Date(profileData.stats.joinDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>



          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{profileData.stats.profileViews.toLocaleString()}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">การดู</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{profileData.stats.likes.toLocaleString()}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">ถูกใจ</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mr-1" />
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{profileData.stats.followers}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">ผู้ติดตาม</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="border-b border-gray-200 mb-6 sm:mb-8">
          <nav className="flex space-x-1 sm:space-x-4 lg:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'ภาพรวม', icon: User },
              { id: 'affiliate', label: 'สินค้า', icon: ShoppingBag },
              { id: 'Withdraw', label: 'ถอนเงิน', icon: DollarSign },
              { id: 'settings', label: 'การตั้งค่า', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center py-3 px-3 sm:px-4 lg:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors min-w-0 flex-1 sm:flex-initial ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">สรุปกิจกรรม</h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{profileData.activity.totalPurchases}</p>
                <p className="text-xs sm:text-sm text-gray-600">การซื้อ</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{profileData.activity.creditsEarned?.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-gray-600">เครดิต</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-xl sm:text-2xl font-bold text-green-600">{(profileData.activity.accountBalance || 0)}</span>
                </div>
                <p className="text-sm text-gray-600">ยอดเงิน</p>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-700 mb-4">รายละเอียดรายได้</h3>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">{(user?.todayEarnings || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">รายได้วันนี้</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{(user?.weekEarnings || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">สัปดาห์นี้</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">{(user?.totalEarned || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">รายได้รวม</p>
                </div>
              </div>
            </div>
          </div>



          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">ชื่อเต็ม</label>
                <p className="text-gray-900 font-medium mt-1">{profileData.personalInfo.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">โทรศัพท์</label>
                <p className="text-gray-900 font-medium mt-1">{profileData.personalInfo.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">ที่อยู่</label>
                <p className="text-gray-900 font-medium mt-1">
                  {profileData.personalInfo.address.street && `${profileData.personalInfo.address.street}, `}
                  {profileData.personalInfo.address.city && `${profileData.personalInfo.address.city}, `}
                  {profileData.personalInfo.address.state && `${profileData.personalInfo.address.state} `}
                  {profileData.personalInfo.address.zipCode && `${profileData.personalInfo.address.zipCode}, `}
                  {profileData.personalInfo.address.country}
                </p>
              </div>
              

              
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">รายละเอียดธนาคาร</label>
                  <button
                    onClick={() => setShowBankDetails(!showBankDetails)}
                    className="text-green-600 hover:text-green-700 text-sm flex items-center font-medium"
                  >
                    {showBankDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showBankDetails ? 'ซ่อน' : 'แสดง'}
                  </button>
                </div>
                {showBankDetails ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-gray-900 font-medium">ธนาคาร: {profileData.personalInfo.bankDetails.bankName || 'ไม่ได้ระบุ'}</p>
                    <p className="text-gray-900 font-medium">บัญชี: {profileData.personalInfo.bankDetails.accountNumber || 'ไม่ได้ระบุ'}</p>
                    <p className="text-gray-900 font-medium">เจ้าของบัญชี: {profileData.personalInfo.bankDetails.accountOwnerName || 'ไม่ได้ระบุ'}</p>
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium mt-1">••••••••</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'affiliate' && (
        <div className="space-y-6">
          {/* My Products */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">สินค้าพันธมิตรของฉัน</h2>
              <button 
                onClick={() => navigate('/shop')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Browse Products
              </button>
            </div>
            
            {affiliateLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : affiliateProducts.length > 0 ? (
              /* Product Grid */
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {affiliateProducts.map((affiliateProduct) => {
                  const product = affiliateProduct.productId;
                  if (!product) return null; // Skip if product is null/undefined
                  
                  const primaryImage = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;
                  const imageUrl = primaryImage?.startsWith('/uploads/') 
                    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${primaryImage}` 
                    : primaryImage || '/placeholder-product.jpg';
                  const price = product.discountedAmount || product.price;
                  const commissionAmount = (price * affiliateProduct.commissionRate) / 100;

                  return (
                    <div key={affiliateProduct._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-xs">
                            {affiliateProduct.commissionRate}%
                          </span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
                          {product.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1">
                          <span className="text-base sm:text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
                          <span className="text-xs sm:text-sm text-green-600 font-medium">${commissionAmount.toFixed(2)} commission</span>
                        </div>
                        {product.rating && product.rating.average > 0 && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            <span>{product.rating.average.toFixed(1)} ({product.rating.count})</span>
                          </div>
                        )}
                        <div className="flex gap-1 sm:gap-2">
                          <button 
                            onClick={() => {
                              // Copy affiliate link to clipboard
                              const affiliateLink = `${window.location.origin}/product/${product._id}?ref=${affiliateProduct.referralCode}`;
                              navigator.clipboard.writeText(affiliateLink);
                              // TODO: Show success toast
                            }}
                            className="flex-1 bg-blue-600 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            แชร์
                          </button>
                          <button 
                            onClick={() => navigate(`/product/${product._id}`)}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => handleRemoveAffiliateProduct(affiliateProduct._id)}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีสินค้า</h3>
                <p className="text-gray-500 mb-6">เริ่มเพิ่มสินค้าในศูนย์พันธมิตรของคุณเพื่อรับค่าคอมมิชชั่น</p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  เรียกดูสินค้า
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'Withdraw' && (
        <div className="space-y-8">
          {/* Available Balance */}
          <div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 opacity-70" />
              </div>
              <div className="space-y-1">
                <p className="text-emerald-100 text-sm font-medium">ยอดเงินที่สามารถใช้ได้</p>
                <p className="text-3xl font-bold">
                  ${(profileData?.activity.accountBalance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">ถอนเงิน</h2>
                  <p className="text-sm text-gray-600">โอนรายได้ของคุณไปยังบัญชีธนาคาร</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Bank Details Check */}
              {!profileData?.personalInfo.bankDetails.accountNumber ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-semibold text-amber-900 mb-1">จำเป็นต้องมีรายละเอียดธนาคาร</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        เพื่อดำเนินการถอนเงิน เราต้องการข้อมูลบัญชีธนาคารของคุณ เพื่อให้มั่นใจในการโอนที่ปลอดภัยและถูกต้อง
                      </p>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        เพิ่มรายละเอียดธนาคาร
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div>
                    <label htmlFor="withdrawAmount" className="block text-sm font-semibold text-gray-900 mb-3">
                      จำนวนเงินที่ต้องการถอน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-lg font-medium">$</span>
                      </div>
                      <input
                        type="number"
                        id="withdrawAmount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        max={profileData?.activity.accountBalance || 0}
                        className="block w-full pl-10 pr-16 py-4 text-xl font-semibold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        disabled={isWithdrawing}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded-md">USD</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-600">
                        ยอดที่สามารถใช้ได้: ${(profileData?.activity.accountBalance || 0).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawAmount((profileData?.activity.accountBalance || 0).toString());
                        }}
                        disabled={isWithdrawing}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        ใช้จำนวนสูงสุด
                      </button>
                    </div>
                  </div>

                  {withdrawError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-500 mr-3" />
                        <p className="text-sm font-medium text-red-800">{withdrawError}</p>
                      </div>
                    </div>
                  )}


                  <button
                    type="submit"
                    disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isWithdrawing ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        กำลังดำเนินการถอนเงิน...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 mr-2" />
                        ขอถอนเงิน
                      </div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
          {/* Withdrawal History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">ประวัติการถอนเงิน</h2>
                    <p className="text-sm text-gray-600">ติดตามคำขอถอนเงินและสถานะของคุณ</p>
                  </div>
                </div>
                {withdrawalHistory.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {withdrawalHistory.length} รายการ
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {withdrawalLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : withdrawalHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการถอนเงิน</h3>
                  <p className="text-gray-600 mb-4">คำขอถอนเงินของคุณจะปรากฏที่นี่เมื่อคุณทำการขอครั้งแรก</p>
                  <div className="inline-flex items-center text-sm text-emerald-600 font-medium">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    เริ่มต้นด้วยการขอถอนเงินด้านบน
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalHistory.map((withdrawal, index) => (
                    <div key={withdrawal._id || index} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${
                            withdrawal.status === 'completed' ? 'bg-emerald-100' :
                            withdrawal.status === 'approved' ? 'bg-blue-100' :
                            withdrawal.status === 'rejected' ? 'bg-red-100' :
                            'bg-amber-100'
                          }`}>
                            {withdrawal.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : withdrawal.status === 'approved' ? (
                              <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            ) : withdrawal.status === 'rejected' ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-xl font-bold text-gray-900 mr-2">
                                ${withdrawal.amount?.toFixed(2)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                withdrawal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              ขอเมื่อ {new Date(withdrawal.requestDate || withdrawal.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>


                      {withdrawal.notes && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-start">
                            <div className="p-1 bg-blue-100 rounded mr-2 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-blue-900">หมายเหตุจากแอดมิน:</span>
                              <p className="text-sm text-blue-800 mt-1">{withdrawal.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {withdrawal.processedDate && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            ดำเนินการเมื่อ {new Date(withdrawal.processedDate).toLocaleDateString('th-TH')}
                          </span>
                          {withdrawal.transactionId && (
                            <span className="text-xs text-gray-500 font-mono">
                              ID: {withdrawal.transactionId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่าบัญชี</h2>
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
      </div>
    </div>
  );
};

export default ProfilePage;