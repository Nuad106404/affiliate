import React, { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Search, RefreshCw, Check, ChevronLeft, ChevronRight, Key, Clock } from 'lucide-react';
import Modal from './common/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ReferralCode {
  id: string;
  code: string;
  userName?: string;
  phone?: string;
  createdAt: string;
}

const ReferralCodeManagement: React.FC = () => {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchReferralCodes();
    }
  }, [token, currentPage, searchTerm]);

  const fetchReferralCodes = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const { data } = await axios.get(`/api/referral-codes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReferralCodes(data.referralCodes || []);
      setTotalPages(data.totalPages || 1);
      setTotalCodes(data.total || 0);
      
    } catch (err: any) {
      console.error('Error fetching referral codes:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดรหัสแนะนำได้');
      setReferralCodes([]);
    } finally {
      setLoading(false);
    }
  };


  const generateCodes = async () => {
    if (!token) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data } = await axios.post('/api/referral-codes/generate', 
        { count: generateCount },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // If we're on the first page, update the list immediately
      if (currentPage === 1) {
        setReferralCodes(prev => [...(data.referralCodes || []), ...prev]);
      } else {
        // Otherwise, go to first page to see new codes
        setCurrentPage(1);
      }
      
      setIsGenerateModalOpen(false);
      setGenerateCount(1);
      
    } catch (err: any) {
      console.error('Error generating codes:', err);
      setError(err.response?.data?.message || 'ไม่สามารถสร้างรหัสได้');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const deleteCode = async (id: string) => {
    if (!token) return;
    
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรหัสแนะนำนี้?')) {
      try {
        await axios.delete(`/api/referral-codes/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Update local state
        setReferralCodes(prev => prev.filter(code => code.id !== id));
        
      } catch (err: any) {
        console.error('Error deleting code:', err);
        alert(err.response?.data?.message || 'ไม่สามารถลบรหัสได้');
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการรหัสแนะนำ</h1>
          <p className="text-gray-600">สร้างและจัดการรหัสแนะนำแบบใช้ครั้งเดียวสำหรับการลงทะเบียนผู้ใช้</p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          สร้างรหัส
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">รหัสทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalCodes}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Key className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">พร้อมใช้งาน</p>
              <p className="text-2xl font-bold text-gray-900">{totalCodes}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหารหัส..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
      </div>

      {/* Referral Codes Table */}
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
                    รหัส
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                          {code.code}
                        </span>
                        {code.userName && (
                          <span className="ml-2 text-xs text-gray-500">{code.userName}</span>
                        )}
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="คัดลอกรหัส"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        'bg-green-100 text-green-800'
                      }`}>
                        พร้อมใช้งาน
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    แสดงหน้า <span className="font-medium">{currentPage}</span> จาก{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="p-4 border-t border-gray-200 bg-red-50 text-red-600">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Codes Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="สร้างรหัสแนะนำ"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จำนวนรหัสที่ต้องการสร้าง
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={generateCount}
              onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">สูงสุด 100 รหัสต่อครั้ง</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">ข้อมูลการสร้างรหัส</h4>
                <p className="text-sm text-blue-700 mt-1">
                  แต่ละรหัสจะเป็นตัวเลข 6 หลักที่ไม่ซ้ำกัน รหัสใช้ได้เพียงครั้งเดียวและจะถูกลบโดยอัตโนมัติเมื่อผู้ใช้ลงทะเบียนด้วยรหัสนั้น
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={generateCodes}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  สร้าง {generateCount} รหัส
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReferralCodeManagement;