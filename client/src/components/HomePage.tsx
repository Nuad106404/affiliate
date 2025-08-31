import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Crown, ShoppingBag, Star, TrendingUp, Users, Headphones, Truck, ArrowRight, Zap, Gift, Target, Wallet } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

interface FeaturedProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedAmount?: number;
  images?: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
  rating?: {
    average: number;
    count: number;
  };
  category: string;
  createdAt: string;
  status: string;
  stock: number;
}

interface DashboardStats {
  totalPurchases: number;
  creditsRemaining: number;
  affiliateEarnings: number;
}

interface Activity {
  id: string;
  type: 'purchase' | 'earning' | 'credit' | 'notification';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    
    try {
      // Fetch real products from API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/products?limit=3`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data.products);
        setFeaturedProducts(data.products || []);
      } else {
        console.error('Failed to fetch products, status:', response.status);
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
    }

    setStats({
      totalPurchases: user?.totalPurchases || 0,
      creditsRemaining: user?.credits || 0,
      affiliateEarnings: user?.totalEarned || 0
    });

    setRecentActivity([
      {
        id: '1',
        type: 'purchase',
        title: 'Product Purchase',
        description: 'Premium Marketing Course',
        amount: -299,
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        type: 'earning',
        title: 'Affiliate Earning',
        description: 'Commission from SEO Toolkit Pro',
        amount: 45,
        timestamp: '1 day ago'
      },
      {
        id: '3',
        type: 'credit',
        title: 'Credits Added',
        description: 'Bonus credits for referral',
        amount: 500,
        timestamp: '3 days ago'
      }
    ]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Shopify-Style Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 bg-white lg:max-w-2xl lg:w-full">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <div className="relative pt-6 px-4 pb-8 sm:px-6 lg:px-8">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                loop={true}
                className="hero-swiper"
              >
                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-2xl overflow-hidden border border-green-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-green-200 to-green-300 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute bottom-10 left-8 w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-lg"></div>
                      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full blur-lg animate-bounce"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="first-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#first-grid)" />
                      </svg>
                    </div>

                    {/* Floating Icons - Mobile Responsive */}
                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-8 h-8 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md animate-float">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-green-600">
                        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                      </svg>
                    </div>
                    
                    <div className="absolute bottom-12 right-4 sm:bottom-16 sm:right-8 w-6 h-6 sm:w-8 sm:h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center h-full px-3 sm:px-6 pb-6 sm:pb-8 lg:px-8 lg:pb-8">
                      <div className="flex-1 text-center lg:text-left w-full lg:w-auto">
                        {/* Enhanced Brand Badge */}
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full mb-3 sm:mb-4 shadow-sm border border-green-200">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
                          <span className="text-xs sm:text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">โซลูชันธุรกิจอัจฉริยะ</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-blue-600 to-green-600 mb-3 sm:mb-4 tracking-tight animate-gradient">
                          SHOPIFY
                        </h1>
                        
                        <div className="mb-4 sm:mb-6">
                          <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-1 font-medium">
                            การตัดสินใจที่ชาญฉลาดสำหรับเจ้าของ
                          </p>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-700 font-medium">
                            ธุรกิจมือใหม่
                          </p>
                        </div>
                        
                        {/* Enhanced Feature Highlights */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                          <div className="group flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-green-200 hover:shadow-md transition-all duration-300">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2 group-hover:animate-ping"></div>
                            <span className="text-xs text-green-700 font-semibold">ติดตั้งง่าย</span>
                          </div>
                          <div className="group flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-blue-200 hover:shadow-md transition-all duration-300">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2 group-hover:animate-ping"></div>
                            <span className="text-xs text-blue-700 font-semibold">ชำระเงินปลอดภัย</span>
                          </div>
                          <div className="group flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-purple-200 hover:shadow-md transition-all duration-300">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-1.5 sm:mr-2 group-hover:animate-ping"></div>
                            <span className="text-xs text-purple-700 font-semibold">สนับสนุน 24/7</span>
                          </div>
                        </div>

                        {/* Call to Action */}
                        <div className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <span>เริ่มต้นธุรกิจของคุณ</span>
                          <svg className="ml-1.5 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>

                      </div>
                      
                      {/* 3D Store Illustration - Mobile Responsive */}
                      <div className="flex-1 flex justify-center items-center mt-4 lg:mt-0">
                        <div className="relative">
                          {/* Store Building */}
                          <div className="relative w-32 h-28 sm:w-40 sm:h-32 md:w-48 md:h-40 lg:w-64 lg:h-52">
                            {/* Base Platform */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-36 sm:w-44 md:w-56 h-3 sm:h-4 bg-gray-600 rounded-lg shadow-2xl"></div>
                            
                            {/* Main Store Structure */}
                            <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-28 sm:w-32 md:w-40 h-24 sm:h-28 md:h-32 bg-white rounded-t-lg shadow-xl">
                              {/* Store Front */}
                              <div className="absolute top-0 left-0 right-0 h-8 bg-green-500 rounded-t-lg"></div>
                              
                              {/* Awning */}
                              <div className="absolute top-8 left-0 right-0 h-6 bg-green-400 shadow-md">
                                <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-600"></div>
                                {/* Stripes */}
                                <div className="absolute top-0 left-2 bottom-2 w-1 bg-green-600"></div>
                                <div className="absolute top-0 left-6 bottom-2 w-1 bg-green-600"></div>
                                <div className="absolute top-0 left-10 bottom-2 w-1 bg-green-600"></div>
                                <div className="absolute top-0 right-10 bottom-2 w-1 bg-green-600"></div>
                                <div className="absolute top-0 right-6 bottom-2 w-1 bg-green-600"></div>
                                <div className="absolute top-0 right-2 bottom-2 w-1 bg-green-600"></div>
                              </div>
                              
                              {/* Windows */}
                              <div className="absolute top-16 left-2 w-6 h-8 bg-blue-100 border border-gray-300"></div>
                              <div className="absolute top-16 right-2 w-6 h-8 bg-blue-100 border border-gray-300"></div>
                              
                              {/* Door */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-green-600 rounded-t-lg">
                                <div className="absolute top-2 left-1 w-6 h-8 bg-green-100 rounded"></div>
                                <div className="absolute top-6 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                              </div>
                              
                              {/* OPEN Sign */}
                              <div className="absolute bottom-2 right-1 w-8 h-4 bg-green-500 rounded text-xs text-white flex items-center justify-center font-bold shadow-sm">
                                OPEN
                              </div>
                            </div>
                            
                            {/* Shopping Cart */}
                            <div className="absolute bottom-6 left-4 w-8 h-6">
                              <div className="w-6 h-4 border-2 border-gray-400 rounded-sm bg-white"></div>
                              <div className="absolute bottom-0 left-0 w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="absolute bottom-0 right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="absolute top-0 right-0 w-2 h-3 border-l-2 border-gray-400"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl overflow-hidden border border-purple-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-25">
                      <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-2xl animate-pulse"></div>
                      <div className="absolute bottom-12 left-10 w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-xl"></div>
                      <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-lg animate-bounce"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="second-grid" width="6" height="6" patternUnits="userSpaceOnUse">
                            <circle cx="3" cy="3" r="1" fill="currentColor" opacity="0.4"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#second-grid)" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 sm:px-4 py-2 sm:py-3 pb-6 sm:pb-8">
                      {/* Enhanced Title Section */}
                      <div className="text-center mb-3 sm:mb-4">
                        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-2 shadow-sm border border-purple-200">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">โซลูชันองค์กร</span>
                        </div>
                        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-700 mb-1 text-center">
                          รองรับธุรกิจที่เติบโตด้วย
                        </h1>
                        <h2 className="text-xl sm:text-2xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 mb-2 sm:mb-3 text-center animate-gradient">
                          Shopify Plus
                        </h2>
                      </div>
                      
                      {/* Enhanced Cloud-Based Shop Illustration - Mobile Responsive */}
                      <div className="relative mb-3 sm:mb-4">
                        {/* Floating Growth Indicators */}
                        <div className="absolute -top-1 sm:-top-2 -right-4 sm:-right-6 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping"></div>
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        
                        {/* Modern Cloud Container with Enhanced Gradient */}
                        <div className="relative w-48 h-28 sm:w-56 sm:h-32 md:w-64 md:h-36 bg-gradient-to-br from-white via-purple-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-xl border border-purple-200 backdrop-blur-sm">
                          {/* Enhanced Cloud Effects - Mobile Responsive */}
                          <div className="absolute -top-1 sm:-top-2 left-2 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-70"></div>
                          <div className="absolute -top-1 right-4 sm:right-6 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-60"></div>
                          <div className="absolute -bottom-1 left-4 sm:left-8 w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-50"></div>
                          <div className="absolute -bottom-1 right-2 sm:right-4 w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-60"></div>
                          
                          {/* Enhanced Central Shop Building */}
                          <div className="relative z-10">
                            {/* Main Store Structure with Glass Effect */}
                            <div className="w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-18 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl relative border border-purple-200">
                              {/* Premium Awning */}
                              <div className="absolute -top-1.5 left-0 right-0 h-3 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-t-xl shadow-md">
                                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-t-xl"></div>
                              </div>
                              
                              {/* Premium PLUS Badge */}
                              <div className="absolute top-0.5 sm:top-1 left-1/2 transform -translate-x-1/2 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-xs font-black tracking-wide shadow-sm">
                                PLUS
                              </div>
                              
                              {/* Enterprise Features */}
                              <div className="absolute top-0.5 right-0.5 w-4 h-2 sm:w-6 sm:h-3 bg-gradient-to-r from-green-500 to-green-600 rounded text-xs text-white flex items-center justify-center font-bold shadow-sm">
                                <span className="hidden sm:inline">PRO</span>
                                <span className="sm:hidden text-xs">P</span>
                              </div>
                              
                              {/* Advanced Store Elements */}
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-purple-600 to-blue-700 rounded-t-md"></div>
                              
                              {/* Premium Display Windows */}
                              <div className="absolute top-6 left-1.5 w-3 h-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded border border-purple-300 shadow-sm"></div>
                              <div className="absolute top-6 right-1.5 w-3 h-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded border border-blue-300 shadow-sm"></div>
                            </div>
                            
                            {/* Premium Global Network Icon */}
                            <div className="absolute -left-6 top-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-md animate-pulse">
                              <div className="w-3 h-3 text-white">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              </div>
                            </div>
                            
                            {/* Premium Analytics Dashboard */}
                            <div className="absolute -right-4 bottom-1 w-5 h-3 bg-gradient-to-br from-green-500 to-blue-500 rounded shadow-md flex items-center justify-center">
                              <div className="w-2.5 h-2.5 text-white">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                </svg>
                              </div>
                            </div>
                            
                            {/* Premium Features Indicators */}
                            <div className="absolute -top-2 left-4 w-3 h-3 bg-white/90 backdrop-blur-sm border border-purple-300 rounded-full shadow-sm flex items-center justify-center animate-bounce">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            </div>
                            
                            <div className="absolute -bottom-1 right-6 w-4 h-4 bg-white/90 backdrop-blur-sm border border-blue-300 rounded-full shadow-sm flex items-center justify-center">
                              <div className="w-2 h-2 text-blue-600">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Enterprise Features */}
                      <div className="grid grid-cols-3 gap-1.5 max-w-lg w-full">
                        <div className="group flex flex-col items-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-purple-200 hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex items-center justify-center text-white font-bold text-xs mb-1 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-purple-900 text-center leading-tight">วิเคราะห์ขั้นสูง</span>
                        </div>
                        
                        <div className="group flex flex-col items-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-blue-200 hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center text-white font-bold text-xs mb-1 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-blue-900 text-center leading-tight">ประสิทธิภาพสูง</span>
                        </div>
                        
                        <div className="group flex flex-col items-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-green-200 hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-md flex items-center justify-center text-white font-bold text-xs mb-1 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-green-900 text-center leading-tight">ความปลอดภัย</span>
                        </div>
                      </div>
                      
                      {/* Call to Action */}
                      <div className="mt-3 text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <span>อัพเกรดเป็น Shopify Plus</span>
                          <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl overflow-hidden border border-blue-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-xl"></div>
                      <div className="absolute bottom-8 left-6 w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full blur-lg"></div>
                      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full blur-lg"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="grid-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
                            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid-pattern)" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-start h-full px-3 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-8">
                      {/* Enhanced Title Section */}
                      <div className="text-center mb-3 sm:mb-5">
                        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-blue-100 rounded-full mb-2 sm:mb-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
                          <span className="text-xs font-medium text-blue-700">โซลูชันอีคอมเมิร์ซ</span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-700 mb-1 sm:mb-2">
                          Shopify ช่วยเพิ่มยอดขาย
                        </h1>
                        <h2 className="text-sm font-bold text-blue-600 flex items-center justify-center gap-2">
                          <span>ได้อย่างไร?</span>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                        </h2>
                      </div>
                      
                      {/* Enhanced Benefits Grid - Mobile Responsive */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full">
                        {/* Benefit 1 */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl"></div>
                          <div className="relative">
                            <div className="flex items-center mb-1.5 sm:mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 sm:w-4 sm:h-4">
                                  <path d="M9 17l3-2.94c-.39-.04-.68-.06-1-.06-2.67 0-8 1.34-8 4v2h9l-3-3zm7-14c-2.67 0-8 1.34-8 4v2c0 2.66 5.33 4 8 4s8-1.34 8-4V7c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                              <div className="ml-1.5 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full opacity-60 group-hover:animate-ping"></div>
                            </div>
                            <h3 className="text-xs font-bold text-blue-900 mb-1">วิเคราะห์ลูกค้า</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              เข้าใจพฤติกรรมและความต้องการ
                            </p>
                          </div>
                        </div>

                        {/* Benefit 2 */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl"></div>
                          <div className="relative">
                            <div className="flex items-center mb-1.5 sm:mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 sm:w-4 sm:h-4">
                                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                                </svg>
                              </div>
                              <div className="ml-1.5 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full opacity-60 group-hover:animate-ping"></div>
                            </div>
                            <h3 className="text-xs font-bold text-green-900 mb-1">ชำระเงินง่าย</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              รองรับทุกรูปแบบการชำระ
                            </p>
                          </div>
                        </div>

                        {/* Benefit 3 */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl"></div>
                          <div className="relative">
                            <div className="flex items-center mb-1.5 sm:mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 sm:w-4 sm:h-4">
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                </svg>
                              </div>
                              <div className="ml-1.5 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full opacity-60 group-hover:animate-ping"></div>
                            </div>
                            <h3 className="text-xs font-bold text-purple-900 mb-1">รีวิวลูกค้า</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              สร้างความเชื่อมั่นและความน่าเชื่อถือ
                            </p>
                          </div>
                        </div>

                        {/* Benefit 4 */}
                        <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl"></div>
                          <div className="relative">
                            <div className="flex items-center mb-1.5 sm:mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 sm:w-4 sm:h-4">
                                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                                </svg>
                              </div>
                              <div className="ml-1.5 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full opacity-60 group-hover:animate-ping"></div>
                            </div>
                            <h3 className="text-xs font-bold text-orange-900 mb-1">เพิ่มยอดขาย</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              เครื่องมือช่วยเพิ่มประสิทธิภาพ
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Call to Action - Mobile Responsive */}
                      <div className="mt-3 sm:mt-4 text-center">
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <span>เริ่มต้นกับ Shopify</span>
                          <svg className="ml-1.5 sm:ml-2 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl overflow-hidden border border-indigo-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-25">
                      <div className="absolute top-6 right-6 w-28 h-28 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-2xl animate-pulse"></div>
                      <div className="absolute bottom-8 left-8 w-20 h-20 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full blur-xl"></div>
                      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-200 to-indigo-200 rounded-full blur-lg animate-bounce"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="fourth-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.3"/>
                            <circle cx="5" cy="5" r="0.5" fill="currentColor" opacity="0.6"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#fourth-grid)" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 sm:px-4 py-2 sm:py-3 pb-6 sm:pb-8">
                      {/* Enhanced Title Section */}
                      <div className="text-center mb-3 sm:mb-4">
                        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-2 shadow-sm border border-indigo-200">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700">เรื่องราวความสำเร็จ</span>
                        </div>
                        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-700 mb-1 text-center">
                          เรื่องราวความสำเร็จ
                        </h1>
                        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 mb-2 sm:mb-3 text-center animate-gradient">
                          จากลูกค้าจริง
                        </h2>
                      </div>
                      
                      {/* Success Stories Grid - Mobile Responsive */}
                      <div className="grid grid-cols-1 gap-2 sm:gap-3 max-w-lg w-full mb-3 sm:mb-4">
                        {/* Story 1 - Allbirds */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-xl"></div>
                          <div className="relative flex items-start space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xs sm:text-sm">A</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs sm:text-sm font-bold text-indigo-900">Allbirds</h3>
                                <div className="flex items-center">
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                  <span className="text-xs text-gray-500">4.9</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 leading-tight">
                                "ยอดขายเพิ่มขึ้น 300% ใน 6 เดือนแรก พร้อมระบบจัดการที่ง่ายและมีประสิทธิภาพ"
                              </p>
                              <div className="flex items-center mt-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1"></div>
                                <span className="text-xs text-green-600 font-medium">+300% ยอดขาย</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Story 2 - Kylie Cosmetics */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl"></div>
                          <div className="relative flex items-start space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xs sm:text-sm">K</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs sm:text-sm font-bold text-purple-900">Kylie Cosmetics</h3>
                                <div className="flex items-center">
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                  </svg>
                                  <span className="text-xs text-gray-500">4.8</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 leading-tight">
                                "จัดการคำสั่งซื้อหลายล้านรายการได้อย่างราบรื่น ระบบไม่เคยล่ม"
                              </p>
                              <div className="flex items-center mt-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mr-1"></div>
                                <span className="text-xs text-blue-600 font-medium">99.9% Uptime</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      
                      {/* Trust Badges - Mobile Responsive */}
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-green-200 shadow-sm">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-xs font-medium text-green-700">ปลอดภัย</span>
                        </div>
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="text-xs font-medium text-blue-700">เชื่อถือได้</span>
                        </div>
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-xs font-medium text-purple-700">รวดเร็ว</span>
                        </div>
                      </div>
                      
                      {/* Call to Action - Mobile Responsive */}
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <span>เริ่มต้นเรื่องราวของคุณ</span>
                          <svg className="ml-1 sm:ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-cyan-50 via-white to-teal-50 rounded-2xl overflow-hidden border border-cyan-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-cyan-200 to-teal-200 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute bottom-6 left-6 w-20 h-20 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full blur-lg"></div>
                      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-lg animate-bounce"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="fifth-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="2" height="2" fill="currentColor" opacity="0.4"/>
                            <rect x="6" y="6" width="2" height="2" fill="currentColor" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#fifth-grid)" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 sm:px-4 py-2 sm:py-3 pb-6 sm:pb-8">
                      {/* Enhanced Title Section */}
                      <div className="text-center mb-2 sm:mb-3">
                        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-full mb-2 shadow-sm border border-cyan-200">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-teal-700">การปรับแต่งหน้าร้านค้า</span>
                        </div>
                        <h1 className="text-base sm:text-lg font-bold text-gray-700 mb-1 text-center">
                          การปรับแต่งหน้าร้านค้า
                        </h1>
                        <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 mb-2 text-center animate-gradient">
                          Shopify Plus
                        </h2>
                      </div>
                      
                      {/* Customization Features Illustration - Mobile Responsive */}
                      <div className="relative mb-2 sm:mb-3">
                        {/* Main Dashboard Container */}
                        <div className="relative w-64 sm:w-72 h-32 sm:h-40 bg-gradient-to-br from-white via-cyan-50 to-teal-100 rounded-2xl flex items-center justify-center shadow-xl border border-cyan-200 backdrop-blur-sm">
                          {/* Browser Window Header */}
                          <div className="absolute top-0 left-0 right-0 h-5 sm:h-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-t-2xl flex items-center px-1.5 sm:px-2">
                            <div className="flex space-x-0.5 sm:space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 rounded-full"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 rounded-full"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 rounded-full"></div>
                            </div>
                            <div className="flex-1 text-center">
                              <span className="text-xs text-white font-medium">Shopify Plus Admin</span>
                            </div>
                          </div>
                          
                          {/* Dashboard Content */}
                          <div className="relative z-10 mt-3 sm:mt-4 w-full px-2 sm:px-3">
                            {/* Theme Customization Section */}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-cyan-200 shadow-sm">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-cyan-500 to-teal-500 rounded mb-0.5 sm:mb-1 mx-auto"></div>
                                <div className="text-xs text-center font-medium text-cyan-900">Theme</div>
                              </div>
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-teal-200 shadow-sm">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded mb-0.5 sm:mb-1 mx-auto"></div>
                                <div className="text-xs text-center font-medium text-teal-900">Layout</div>
                              </div>
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-blue-200 shadow-sm">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded mb-0.5 sm:mb-1 mx-auto"></div>
                                <div className="text-xs text-center font-medium text-blue-900">Apps</div>
                              </div>
                            </div>
                            
                            {/* Integration Icons */}
                            <div className="flex justify-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">C</span>
                              </div>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">I</span>
                              </div>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                            </div>
                            
                            {/* Status Indicators */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                                <span className="text-xs text-gray-600">Live</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                                <span className="text-xs text-gray-600">Synced</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Floating Feature Icons - Mobile Responsive */}
                          <div className="absolute -top-1.5 sm:-top-2 -left-1.5 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 backdrop-blur-sm border border-cyan-300 rounded-full shadow-md flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                            </svg>
                          </div>
                          
                          <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 backdrop-blur-sm border border-teal-300 rounded-full shadow-md flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          
                          <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-white/90 backdrop-blur-sm border border-blue-300 rounded-full shadow-md flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Feature Categories - Mobile Responsive */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-w-md w-full mb-2 sm:mb-3">
                        {/* Store Customization */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 border border-cyan-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-cyan-900 mb-0.5">ปรับแต่งร้านค้า</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              ธีม โปรโมชัน ฟังก์ชัน
                            </p>
                          </div>
                        </div>

                        {/* System Integration */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 border border-teal-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-teal-900 mb-0.5">เชื่อมต่อระบบ</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              CRM คลัง บัญชี
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Integration Badges - Mobile Responsive */}
                      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-purple-700">CRM</span>
                        </div>
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-green-200 shadow-sm">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-green-700">Inventory</span>
                        </div>
                        <div className="flex items-center px-1.5 sm:px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-orange-200 shadow-sm">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-orange-700">Accounting</span>
                        </div>
                      </div>
                      
                      {/* Call to Action - Mobile Responsive */}
                      <div className="text-center">
                        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <span>ปรับแต่งร้านค้าของคุณ</span>
                          <svg className="ml-1 sm:ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>

                <SwiperSlide>
                  <div className="relative w-full max-w-[608px] h-[400px] sm:h-[450px] lg:h-[500px] mx-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl overflow-hidden border border-slate-100 shadow-lg">
                    {/* Modern Decorative Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-5 right-5 w-26 h-26 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute bottom-7 left-7 w-22 h-22 bg-gradient-to-br from-blue-200 to-slate-200 rounded-full blur-lg"></div>
                      <div className="absolute top-1/2 left-1/4 w-18 h-18 bg-gradient-to-br from-indigo-200 to-slate-200 rounded-full blur-lg animate-bounce"></div>
                    </div>

                    {/* Geometric Pattern Overlay */}
                    <div className="absolute inset-0 opacity-5">
                      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                        <defs>
                          <pattern id="sixth-grid" width="15" height="15" patternUnits="userSpaceOnUse">
                            <circle cx="7.5" cy="7.5" r="1" fill="currentColor" opacity="0.4"/>
                            <rect x="6" y="6" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#sixth-grid)" />
                      </svg>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 sm:px-4 py-2 sm:py-3 pb-6 sm:pb-8">
                      {/* Enhanced Title Section */}
                      <div className="text-center mb-2 sm:mb-3">
                        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gradient-to-r from-slate-100 to-blue-100 rounded-full mb-2 shadow-sm border border-slate-200">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-slate-500 to-blue-500 rounded-full mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700">ที่ช่วยเพิ่มยอดขายให้กับธุรกิจ</span>
                        </div>
                        <h1 className="text-base sm:text-lg font-bold text-gray-700 mb-1 text-center">
                          ฟีเจอร์เด่นของ
                        </h1>
                        <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-600 via-blue-600 to-slate-600 mb-2 text-center animate-gradient">
                          Shopify Plus
                        </h2>
                      </div>
                      
                      {/* Features Grid - Mobile Responsive */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-lg w-full mb-2 sm:mb-3">
                        {/* Shopify Flow */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900 mb-0.5">การจัดการร้านค้า</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              ด้วย <span className="font-semibold text-yellow-600">Shopify Flow</span>
                            </p>
                          </div>
                        </div>

                        {/* Launchpad */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-blue-900 mb-0.5">การสร้างแคมเปญ</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              ผ่าน <span className="font-semibold text-yellow-600">Launchpad</span>
                            </p>
                          </div>
                        </div>

                        {/* Shopify Scripts */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-green-900 mb-0.5">การสร้างข้อเสนอเพื่อ</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              กระตุ้นยอดขายด้วย <span className="font-semibold text-yellow-600">Scripts</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Second Row Features */}
                      <div className="grid grid-cols-2 gap-2 max-w-md w-full mb-3">
                        {/* Platform Integration */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-purple-900 mb-0.5">การผสานกับ</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              แพลตฟอร์มอื่น ๆ เพื่อเพิ่มช่องทางการขาย
                            </p>
                          </div>
                        </div>

                        {/* Shop Pay */}
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-2 border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl"></div>
                          <div className="relative text-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-sm">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="text-xs font-bold text-orange-900 mb-0.5">การชำระเงินที่สะดวก</h3>
                            <p className="text-xs text-gray-600 leading-tight">
                              และรวดเร็วด้วย <span className="font-semibold text-yellow-600">Shop Pay</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Feature Highlights */}
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <div className="flex items-center px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                          <div className="w-2 h-2 bg-slate-500 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-xs font-medium text-slate-700">Automation</span>
                        </div>
                        <div className="flex items-center px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-blue-700">Campaign</span>
                        </div>
                        <div className="flex items-center px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-green-200 shadow-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-xs font-medium text-green-700">Scripts</span>
                        </div>
                      </div>
                      
                      {/* Call to Action */}
                      <div className="text-center">
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-600 to-blue-600 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                          <span>สำรวจฟีเจอร์ทั้งหมด</span>
                          <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>
        
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-green-400 to-green-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto sm:gap-4 md:gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 text-center">
                  <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.totalPurchases || 0}</div>
                  <div className="text-xs sm:text-sm opacity-90">การซื้อ</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 text-center">
                  <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.creditsRemaining?.toLocaleString() || 0}</div>
                  <div className="text-xs sm:text-sm opacity-90">เครดิต</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 text-center">
                  <Wallet className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">${user?.accountBalance || 0}</div>
                  <div className="text-xs sm:text-sm opacity-90">ยอดเงิน</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 text-center">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold">${stats?.affiliateEarnings || 0}</div>
                  <div className="text-xs sm:text-sm opacity-90">รายได้</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators - Mobile Shopping App Style */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-green-100">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">ปลอดภัย & เชื่อถือได้</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">SSL Protected</span>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                ธุรกรรมของคุณได้รับการปกป้องด้วยระบบรักษาความปลอดภัยระดับองค์กร
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">ช่วยเหลือ 24/7</h3>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 ml-1 font-medium">Online Now</span>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                รับความช่วยเหลือเมื่อใดก็ตามที่คุณต้องการจากทีมสนับสนุนเฉพาะของเรา
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-purple-100">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">จัดส่งรวดเร็ว</h3>
                  <div className="flex items-center mt-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-500 ml-1">Instant Access</span>
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                ผลิตภัณฑ์ดิจิทัลจัดส่งทันทีไปยังบัญชีของคุณ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
        {/* Featured Products - Mobile Shopping App Style */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-sm font-semibold mb-3 shadow-lg">
            <Star className="w-4 h-4 mr-2" />
            สินค้าแนะนำ
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            ค้นพบผลิตภัณฑ์ดิจิทัลพรีเมียม
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
            คัดสรรมาอย่างดีพร้อมจัดส่งทันทีและส่วนลดพิเศษ
          </p>
        </div>

        {/* Mobile-Optimized Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {featuredProducts.map((product) => {
            const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
            const imageUrl = primaryImage?.startsWith('/uploads/') 
              ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${primaryImage}` 
              : primaryImage || '/placeholder-product.jpg';
            const hasDiscount = product.discountedAmount != null && product.discountedAmount > 0 && product.discountedAmount < product.price;
            const discountPercent = hasDiscount ? Math.round(((product.price - product.discountedAmount!) / product.price) * 100) : 0;

            return (
              <div key={product._id} className="group h-full">
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300 transform hover:-translate-y-1 h-full flex flex-col">
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Mobile-Optimized Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      {hasDiscount && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                          {discountPercent}% OFF
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/90 text-gray-700 shadow-md backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>

                    {/* Mobile Rating Badge */}
                    {product.rating && product.rating.average > 0 && (
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
                          <Star className="w-3 h-3 text-amber-400 fill-current mr-1" />
                          <span className="text-xs font-bold text-gray-800">{product.rating.average.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                        <ShoppingBag className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Optimized Product Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
                      <Link to={`/shop?product=${product._id}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Compact Rating */}
                    {product.rating && product.rating.average > 0 && (
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                star <= product.rating!.average
                                  ? 'text-amber-400 fill-current'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-500 font-medium">
                          ({product.rating.count})
                        </span>
                      </div>
                    )}

                    {/* Mobile Price and CTA */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1 sm:gap-2">
                          <span className="text-lg sm:text-xl font-black text-gray-900">
                            ${hasDiscount ? product.discountedAmount!.toFixed(2) : product.price.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through font-medium">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-xs text-green-600 font-semibold">
                            Save ${(product.price - product.discountedAmount!).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to={`/shop?product=${product._id}`}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-1 sm:gap-2"
                      >
                        <span className="hidden sm:inline">ดูสินค้า</span>
                        <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile CTA Section */}
        <div className="mt-8 sm:mt-12 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            ดูสินค้าทั้งหมด
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </div>

      {/* Feature Section - Mobile Shopping App Style */}
      <div className="py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold mb-3 shadow-lg">
              <Crown className="w-4 h-4 mr-2" />
              ทุกสิ่งที่คุณต้องการ
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              วิธีที่ดีกว่าในการเติบโตธุรกิจของคุณ
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
              แพลตฟอร์มของเราให้เครื่องมือทั้งหมดที่คุณต้องการเพื่อประสบความสำเร็จในตลาดดิจิทัล
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-yellow-100">
              <div className="flex items-start mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">รวดเร็วเหมือนสายฟ้า</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[1,2,3].map(i => <Zap key={i} className="w-3 h-3" />)}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Instant Access</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                เข้าถึงผลิตภัณฑ์ดิจิทัลได้ทันทีและเริ่มหารายได้ในทันที
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-pink-100">
              <div className="flex items-start mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl shadow-lg mr-4">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">รางวัลพิเศษ</h3>
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-pink-600 ml-2 font-medium">Active Bonuses</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                รับเครดิตและโบนัสผ่านโปรแกรมพันธมิตรที่ครอบคลุมของเรา
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-purple-100">
              <div className="flex items-start mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl shadow-lg mr-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">คุณภาพพรีเมียม</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-purple-400">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Curated</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                ผลิตภัณฑ์ทั้งหมดได้รับการคัดสรรและทดสอบอย่างรอบคอบเพื่อมาตรฐานคุณภาพสูงสุด
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100">
              <div className="flex items-start mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-lg mr-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">โซลูชันที่ตรงเป้า</h3>
                  <div className="flex items-center mb-2">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600 ml-2 font-medium">AI Powered</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                ค้นหาสิ่งที่คุณต้องการได้อย่างแม่นยำด้วยระบบแนะนำอัจฉริยะของเรา
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;