import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, ShoppingCart, Shield, Package, Zap, Award } from 'lucide-react';
import LoadingSpinner from "./common/LoadingSpinner";
import Modal from "./common/Modal";
import { productsAPI } from '../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  discountedAmount?: number;
  discountedPrice?: number;
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  rating: { average: number; count: number };
  category: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  stock: number;
  sku: string;
  vendor?: { name: string; _id: string };
  createdAt: string;
  updatedAt: string;
  primaryImage?: string;
}

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'ทุกหมวดหมู่', icon: '🛍️', color: 'bg-gray-100' },
    { id: 'Education', name: 'การศึกษา', icon: '📚', color: 'bg-blue-100' },
    { id: 'Tools', name: 'เครื่องมือ', icon: '🔧', color: 'bg-green-100' },
    { id: 'Design', name: 'ดีไซน์', icon: '🎨', color: 'bg-purple-100' },
    { id: 'Software', name: 'ซอฟต์แวร์', icon: '💻', color: 'bg-indigo-100' },
    { id: 'Marketing', name: 'การตลาด', icon: '📈', color: 'bg-red-100' },
    { id: 'Business', name: 'ธุรกิจ', icon: '💼', color: 'bg-yellow-100' },
    { id: 'Health', name: 'สุขภาพ', icon: '🏥', color: 'bg-green-100' },
    { id: 'Other', name: 'อื่นๆ', icon: '📦', color: 'bg-gray-100' }
  ];

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      filterAndSortProducts();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory, sortBy, priceRange, products]);

  const fetchAllProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getAll({});
      const fetchedProducts = response.data.products || response.data;
      setProducts(fetchedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError('ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.discountedAmount && product.discountedAmount > 0 ? product.discountedAmount : product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          const priceA = a.discountedAmount && a.discountedAmount > 0 ? a.discountedAmount : a.price;
          const priceB = b.discountedAmount && b.discountedAmount > 0 ? b.discountedAmount : b.price;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = a.discountedAmount && a.discountedAmount > 0 ? a.discountedAmount : a.price;
          const priceB2 = b.discountedAmount && b.discountedAmount > 0 ? b.discountedAmount : b.price;
          return priceB2 - priceA2;
        case 'rating':
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return ratingB - ratingA;
        case 'newest':
        default:
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
    });
    
    setFilteredProducts(filtered);
  };


  const handlePurchase = (productId: string) => {
    console.log('Purchasing product:', productId);
    // TODO: Implement purchase logic with ordersAPI
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchAllProducts()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Mobile Shopping App Hero Section */}
      <div className="bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-30"></div>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4 shadow-lg">
              <ShoppingCart className="w-4 h-4 mr-2" />
              ร้านค้าดิจิทัลพรีเมียม
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
              ช้อปสินค้าพรีเมียม
            </h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-xl mb-6 sm:mb-8 font-medium">
              ค้นพบผลิตภัณฑ์ดิจิทัลหลายพันรายการพร้อมจัดส่งทันที
            </p>
            
            {/* Mobile Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20 shadow-lg">
                <Shield className="w-4 h-4 mr-2 text-green-300" />
                <span className="font-semibold">ปลอดภัย</span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20 shadow-lg">
                <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                <span className="font-semibold">ทันที</span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20 shadow-lg">
                <Award className="w-4 h-4 mr-2 text-purple-300" />
                <span className="font-semibold">พรีเมียม</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile Shopping App Category Navigation */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            ช้อปตามหมวดหมู่
          </h2>
          
          {/* Mobile: Horizontal Scroll - Shopping App Style */}
          <div className="lg:hidden">
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl transition-all duration-300 border-2 min-w-[70px] shadow-md ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-xl transform scale-105'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:shadow-lg'
                  }`}
                >
                  <span className="text-xl mb-1">{category.icon}</span>
                  <span className="text-xs font-bold text-center whitespace-nowrap">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: Grid - Shopping App Style */}
          <div className="hidden lg:grid lg:grid-cols-9 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 border-2 hover:transform hover:scale-105 shadow-md ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-xl'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:shadow-lg'
                }`}
              >
                <span className="text-2xl mb-2">{category.icon}</span>
                <span className="text-sm font-bold text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Shopping App Search and Filters */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          {/* Mobile Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white shadow-md text-sm sm:text-base font-medium placeholder-gray-500 transition-all duration-200"
            />
          </div>

          {/* Mobile Filter Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm"
              >
                <option value="featured">🔥 แนะนำ</option>
                <option value="newest">✨ ใหม่ล่าสุด</option>
                <option value="popular">📈 ยอดนิยม</option>
                <option value="rating">⭐ คะแนนสูงสุด</option>
                <option value="price-low">💰 ราคา: ต่ำไปสูง</option>
                <option value="price-high">💎 ราคา: สูงไปต่ำ</option>
              </select>
              
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="lg:hidden flex items-center px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-2xl text-gray-700 hover:border-green-500 hover:bg-white transition-all duration-200 bg-white text-xs sm:text-sm font-bold shadow-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">ตัวกรอง</span><span className="sm:hidden">กรอง</span>
              </button>
            </div>
          </div>

          {/* Desktop Price Range */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
              <label className="text-sm font-medium text-gray-700">ช่วงราคา:</label>
              <input
                type="range"
                min="0"
                max="15000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm text-gray-600 font-medium">${priceRange[0]} - ${priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Mobile Results Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <p className="text-gray-700 text-sm sm:text-base lg:text-lg font-medium">
              <span className="font-bold text-black">{filteredProducts.length}</span> <span className="hidden sm:inline">สินค้า</span><span className="sm:hidden">รายการ</span>
            </p>
            {selectedCategory !== 'all' && (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full font-bold shadow-md">
                {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-600">
            <div className="flex items-center bg-green-50 px-3 py-2 rounded-full shadow-sm">
              <Package className="w-4 h-4 text-green-600 mr-2" />
              <span className="font-medium">สินค้าใหม่ทุกวัน</span>
            </div>
          </div>
        </div>

        {/* Mobile Shopping App Style Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredProducts.map((product) => {
              const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || product.primaryImage;
              const imageUrl = primaryImage?.startsWith('/uploads/') ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${primaryImage}` : primaryImage || '/placeholder-product.jpg';
              const isNew = new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              const hasDiscount = product.discountedAmount != null && product.discountedAmount > 0 && product.discountedAmount < product.price;
              
              return (
              <div key={product._id} className="group h-full">
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300 h-full flex flex-col">
                  <div className="relative overflow-hidden aspect-[4/3] sm:aspect-square">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Mobile-Optimized Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      {hasDiscount && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                          {Math.round(((product.price - product.discountedAmount!) / product.price) * 100)}% OFF
                        </span>
                      )}
                      {isNew && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                          <Zap className="w-3 h-3 mr-1" /> ใหม่
                        </span>
                      )}
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
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                    {/* Mobile-Optimized Product Title & Rating */}
                    <div className="mb-2 sm:mb-3">
                      <h3 className="font-bold text-gray-900 line-clamp-2 text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                star <= product.rating.average
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">({product.rating.count})</span>
                      </div>
                    </div>
                    
                    {/* Compact Description */}
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                    
                    {/* Mobile Price & CTA */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1 sm:gap-2">
                            <span className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">
                              ${hasDiscount ? product.discountedAmount!.toFixed(2) : product.price.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm sm:text-base lg:text-lg text-gray-400 line-through font-medium">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <span className="text-xs sm:text-sm text-green-600 font-semibold">
                              Save ${(product.price - product.discountedAmount!).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Link
                        to={`/product/${product._id}`}
                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 ${
                          product.stock === 0 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-lg transform hover:scale-105'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{product.stock === 0 ? 'สินค้าหมด' : 'ดูสินค้า'}</span>
                        <span className="sm:hidden">{product.stock === 0 ? 'หมด' : 'ดู'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบสินค้า</h3>
            <p className="text-gray-500 mb-6">ลองปรับการค้นหาหรือตัวกรองของคุณ</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange([0, 15000]);
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>


      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="ตัวกรอง"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">หมวดหมู่</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : `${category.color} text-gray-700 hover:shadow-sm`
                  }`}
                >
                  <span className="text-lg mr-2">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงราคา</label>
            <input
              type="range"
              min="0"
              max="15000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              ใช้ตัวกรอง
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShopPage;