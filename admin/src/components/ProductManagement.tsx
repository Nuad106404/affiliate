import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Modal from './common/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { productsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  discountedAmount?: number;
  discountedPrice?: number;
  category: string;
  status: 'active' | 'inactive';
  stock: number;
  commissionRate?: number;
  vendor?: {
    name: string;
    _id: string;
  };
  tags?: string[];
  images?: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
  rating?: {
    average: number;
    count: number;
  };
  views?: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: number;
  discountedAmount: number;
  category: string;
  status: 'active' | 'inactive';
  stock: number;
  sku: string;
  tags: string;
  vendorName: string;
  images: FileList | null;
  ratingAverage: number;
  ratingCount: number;
  views: number;
  commissionRate: number;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>();
  const { token } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || response.data);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        discountedAmount: product.discountedAmount || 0,
        category: product.category,
        status: product.status,
        stock: product.stock,
        sku: product.sku || '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        vendorName: product.vendor?.name || '',
        images: null,
        ratingAverage: product.rating?.average || 0,
        ratingCount: product.rating?.count || 0,
        views: product.views || 0,
        commissionRate: product.commissionRate || 10
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        discountedAmount: 0,
        category: '',
        status: 'active',
        stock: 0,
        sku: '',
        tags: '',
        vendorName: '',
        images: null,
        ratingAverage: 0,
        ratingCount: 0,
        views: 0,
        commissionRate: 10
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('discountedAmount', data.discountedAmount.toString());
      formData.append('category', data.category);
      formData.append('status', data.status);
      formData.append('stock', data.stock.toString());
      formData.append('sku', data.sku);
      formData.append('vendorName', data.vendorName);
      formData.append('commissionRate', data.commissionRate.toString());
      
      // Add rating and analytics fields
      formData.append('ratingAverage', data.ratingAverage.toString());
      formData.append('ratingCount', data.ratingCount.toString());
      formData.append('views', data.views.toString());
      
      // Add tags as array
      if (data.tags && typeof data.tags === 'string') {
        const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagsArray));
      }
      
      // Add images
      if (data.images && data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          formData.append('images', data.images[i]);
        }
      }

      if (editingProduct) {
        // Update existing product
        const response = await productsAPI.update(editingProduct._id, formData);
        setProducts(prev => prev.map(p => 
          p._id === editingProduct._id ? response.data : p
        ));
      } else {
        // Create new product
        const response = await productsAPI.create(formData);
        setProducts(prev => [response.data, ...prev]);
      }
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'ไม่สามารถบันทึกสินค้าได้');
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) {
      try {
        await productsAPI.delete(id);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch (error: any) {
        console.error('Error deleting product:', error);
        setError(error.response?.data?.message || 'ไม่สามารถลบสินค้าได้');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:min-h-screen">
      <div className="p-4 lg:p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการสินค้า</h1>
          <p className="text-gray-600">จัดการสินค้าในตลาดออนไลน์ของคุณ</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสินค้า
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        {(product.discount && product.discount > 0) || (product.discountedAmount && product.discountedAmount > 0) ? (
                          <>
                            <span className="text-green-600 font-semibold">
                              ${product.discountedAmount ? product.discountedAmount.toFixed(2) : (product.price * (1 - product.discount! / 100)).toFixed(2)}
                            </span>
                            <span className="text-gray-500 line-through text-xs">${product.price}</span>
                            <span className="text-red-500 text-xs">
                              {product.discountedAmount && product.discountedAmount < product.price ? 
                                `ลด $${(product.price - product.discountedAmount).toFixed(2)} (${(((product.price - product.discountedAmount) / product.price) * 100).toFixed(1)}%)` : 
                                `ลด ${(product.discount || 0).toFixed(1)}%`}
                            </span>
                          </>
                        ) : (
                          <span>${product.price}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>

    {/* Product Modal */}
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อสินค้า</label>
            <input
              {...register('name', { required: 'กรุณากรอกชื่อสินค้า' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสสินค้า (SKU)</label>
            <input
              {...register('sku', { required: 'กรุณากรอกรหัสสินค้า' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.sku && <p className="text-red-500 text-sm">{errors.sku.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อผู้จำหน่าย</label>
            <input
              {...register('vendorName', { required: 'กรุณากรอกชื่อผู้จำหน่าย' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.vendorName && <p className="text-red-500 text-sm">{errors.vendorName.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">แท็ก</label>
            <input
              {...register('tags')}
              placeholder="กรอกแท็กคั่นด้วยเครื่องหมายจุลภาค"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">คั่นแท็กหลายๆ อันด้วยเครื่องหมายจุลภาค</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">รายละเอียดสินค้า</label>
          <textarea
            {...register('description', { required: 'กรุณากรอกรายละเอียดสินค้า' })}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">รูปภาพสินค้า</label>
          
          {/* Display existing images when editing */}
          {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">รูปภาพปัจจุบัน:</p>
              <div className="flex flex-wrap gap-2">
                {editingProduct.images.map((image: any, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={image.url.startsWith('/uploads/') ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${image.url}` : image.url}
                      alt={image.alt || `Product image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    />
                    {image.isPrimary && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                        หลัก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <input
            {...register('images')}
            type="file"
            multiple
            accept="image/*"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {editingProduct ? 'เลือกรูปภาพใหม่เพื่อแทนที่รูปเดิม (สูงสุด 5 รูป ขนาดไม่เกิน 5MB ต่อรูป)' : 'เลือกรูปภาพสูงสุด 5 รูป (ขนาดไม่เกิน 5MB ต่อรูป)'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ราคา ($)</label>
            <input
              {...register('price', { 
                required: 'กรุณากรอกราคา',
                min: { value: 0, message: 'ราคาต้องเป็นจำนวนบวก' }
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
          </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700">ราคาหลังลดราคา ($)</label>
              <input
                {...register('discountedAmount', { 
                  min: { value: 0, message: 'ราคาหลังลดราคาต้องเป็น 0 หรือมากกว่า' }
                })}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.discountedAmount && <p className="text-red-500 text-sm">{errors.discountedAmount.message}</p>}
              <p className="text-xs text-gray-500 mt-1">ราคาสุดท้ายหลังลดราคา เปอร์เซ็นต์ส่วนลดจะคำนวณอัตโนมัติ</p>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">จำนวนสต็อก</label>
            <input
              {...register('stock', { 
                required: 'กรุณากรอกจำนวนสต็อก',
                min: { value: 0, message: 'จำนวนสต็อกต้องไม่เป็นลบ' }
              })}
              type="number"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">อัตราค่าคอมมิชชั่น (%)</label>
            <input
              {...register('commissionRate', { 
                required: 'กรุณากรอกอัตราค่าคอมมิชชั่น',
                min: { value: 0, message: 'อัตราค่าคอมมิชชั่นต้องเป็น 0 หรือมากกว่า' },
                max: { value: 50, message: 'อัตราค่าคอมมิชชั่นต้องไม่เกิน 50%' }
              })}
              type="number"
              step="0.1"
              min="0"
              max="50"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.commissionRate && <p className="text-red-500 text-sm">{errors.commissionRate.message}</p>}
            <p className="text-xs text-gray-500 mt-1">เปอร์เซ็นต์ค่าคอมมิชชั่นพันธมิตร (0-50%)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
            <select
              {...register('category', { required: 'กรุณาเลือกหมวดหมู่' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              <option value="Education">การศึกษา</option>
              <option value="Tools">เครื่องมือ</option>
              <option value="Design">การออกแบบ</option>
              <option value="Software">ซอฟต์แวร์</option>
              <option value="Marketing">การตลาด</option>
              <option value="Business">ธุรกิจ</option>
              <option value="Health">สุขภาพ</option>
              <option value="Other">อื่นๆ</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>
        </div>

        {/* Rating and Analytics Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">คะแนนและการวิเคราะห์</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">คะแนนเฉลี่ย</label>
              <input
                {...register('ratingAverage', { 
                  min: { value: 0, message: 'คะแนนต้องอยู่ระหว่าง 0 ถึง 5' },
                  max: { value: 5, message: 'คะแนนต้องอยู่ระหว่าง 0 ถึง 5' }
                })}
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.ratingAverage && <p className="text-red-500 text-sm">{errors.ratingAverage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">จำนวนการให้คะแนน</label>
              <input
                {...register('ratingCount', { 
                  min: { value: 0, message: 'จำนวนการให้คะแนนต้องไม่เป็นลบ' }
                })}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.ratingCount && <p className="text-red-500 text-sm">{errors.ratingCount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">จำนวนการดู</label>
              <input
                {...register('views', { 
                  min: { value: 0, message: 'จำนวนการดูต้องไม่เป็นลบ' }
                })}
                type="number"
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.views && <p className="text-red-500 text-sm">{errors.views.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">สถานะ</label>
          <select
            {...register('status')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">ใช้งาน</option>
            <option value="inactive">ไม่ใช้งาน</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editingProduct ? 'อัปเดต' : 'สร้าง'}สินค้า
          </button>
        </div>
      </form>
    </Modal>
  </div>
);
};

export default ProductManagement;