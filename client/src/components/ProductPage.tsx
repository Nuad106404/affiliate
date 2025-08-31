import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, ShoppingCart, Plus, Eye, Clock, Truck, Shield, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { affiliateProductsAPI, productsAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';
import Swal from 'sweetalert2';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedAmount?: number;
  category: string;
  stock: number;
  status: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  rating: {
    average: number;
    count: number;
  };
  views: number;
  vendor?: {
    name: string;
  };
  createdAt: string;
  tags?: string[];
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getById(productId);
      setProduct(response.data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToAffiliateCenter = async () => {
    if (!product?._id) return;
    
    // Real-time status check - fetch latest user data
    try {
      const response = await authAPI.getCurrentUser();
      const currentUser = response.data;
      
      if (currentUser.status === 'inactive') {
        Swal.fire({
          title: 'Account Inactive',
          text: 'Contact Admin',
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
          title: 'Account Inactive',
          text: 'Contact Admin',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
    }
    
    try {
      console.log('Adding product to affiliate center:', product._id);
      console.log('Current token:', localStorage.getItem('token'));
      const response = await affiliateProductsAPI.add(product._id);
      console.log('Success response:', response);
      
      // Show success message
      await Swal.fire({
        title: 'Success!',
        text: 'Product added to affiliate center successfully',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3B82F6'
      });
      
      console.log('Product added to affiliate center successfully');
      // Optionally navigate to affiliate center
      // navigate('/profile?tab=affiliate');
    } catch (error: any) {
      console.error('Error adding to affiliate center:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show error message
      await Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to add product to affiliate center',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#EF4444'
      });
    }
  };


  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  const nextImage = () => {
    if (product?.images && selectedImageIndex < product.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
  const imageUrl = primaryImage?.startsWith('/uploads/') 
    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${primaryImage}` 
    : primaryImage || '/placeholder-product.jpg';
  
  const isNew = new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hasDiscount = product.discountedAmount && product.discountedAmount < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountedAmount!) / product.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shop
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={product.images?.[selectedImageIndex]?.url?.startsWith('/uploads/') 
                    ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${product.images[selectedImageIndex].url}` 
                    : product.images?.[selectedImageIndex]?.url || imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={selectedImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={selectedImageIndex === product.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    {product.category}
                  </span>
                  {isNew && (
                    <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">
                      ✨ New
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Image Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url?.startsWith('/uploads/') 
                          ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${image.url}` 
                          : image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>

              {/* Rating and Stats */}
              <div className="flex items-center gap-6">
                {product.rating.average > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{product.rating.average.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500">({product.rating.count} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Eye className="w-5 h-5" />
                  <span>{product.views} views</span>
                </div>
              </div>

              {/* Vendor */}
              {product.vendor && (
                <div className="text-gray-600">
                  <span className="font-medium">Sold by:</span> {product.vendor.name}
                </div>
              )}

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900">
                    ${hasDiscount ? product.discountedAmount!.toFixed(2) : product.price.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-2xl text-gray-400 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <div className="text-emerald-600 font-semibold">
                    You save ${(product.price - product.discountedAmount!).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToAffiliateCenter}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  Add to Affiliate Center
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Free Shipping</div>
                  <div className="text-xs text-gray-500">On orders over $50</div>
                </div>
                <div className="text-center">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Secure Payment</div>
                  <div className="text-xs text-gray-500">100% protected</div>
                </div>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Fast Delivery</div>
                  <div className="text-xs text-gray-500">2-3 business days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="px-8 pb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
