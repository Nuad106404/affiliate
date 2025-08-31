import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Shield, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import Modal from './common/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import { useForm } from 'react-hook-form';

interface Admin {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'superadmin';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  isDefaultSuperAdmin?: boolean;
}

interface AdminForm {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AdminForm>();
  const password = watch('password');


  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        console.error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phone.includes(searchTerm)
  );

  const openModal = (admin?: Admin) => {
    setEditingAdmin(admin || null);
    if (admin) {
      reset({
        name: admin.name,
        phone: admin.phone,
        password: '',
        confirmPassword: '',
        role: admin.role,
        permissions: admin.permissions
      });
    } else {
      reset({
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AdminForm) => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingAdmin) {
        // Update existing admin
        const response = await fetch(`http://localhost:5001/api/admin/admins/${editingAdmin.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            role: data.role,
            permissions: ['products', 'users', 'referrals'],
            ...(data.password && data.password.trim() !== '' && { password: data.password })
          }),
        });

        if (response.ok) {
          fetchAdmins(); // Refresh the list
        }
      } else {
        // Create new admin
        const response = await fetch('http://localhost:5001/api/admin/register-admin', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            password: data.password,
            role: data.role,
            permissions: ['products', 'users', 'referrals']
          }),
        });

        if (response.ok) {
          fetchAdmins(); // Refresh the list
        }
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving admin:', error);
    }
  };

  const toggleAdminStatus = (adminId: string) => {
    setAdmins(prev => prev.map(admin =>
      admin.id === adminId
        ? {
            ...admin,
            status: admin.status === 'active' ? 'inactive' : 'active'
          }
        : admin
    ));
  };

  const deleteAdmin = async (adminId: string, admin: Admin) => {
    if (admin.isDefaultSuperAdmin) {
      alert('ไม่สามารถลบผู้ดูแลสูงสุดเริ่มต้นได้');
      return;
    }
    
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ดูแลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/admin/users/${adminId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          fetchAdmins(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ดูแลระบบ</h1>
            <p className="text-gray-600">จัดการผู้ดูแลระบบและสิทธิ์ของพวกเขา</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition-colors shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มผู้ดูแล
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ผู้ดูแลที่ใช้งาน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => a.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ผู้ดูแลที่ไม่ใช้งาน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => a.status === 'inactive').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ผู้ดูแลทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Shield className="w-6 h-6 text-white" />
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
              placeholder="ค้นหาผู้ดูแล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
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
                      ผู้ดูแล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ข้อมูลติดต่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เข้าสู่ระบบล่าสุด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                            <div className="text-sm text-gray-500">สร้างเมื่อ {admin.createdAt}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.phone}</div>
                        <div className="text-sm text-gray-500">{admin.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAdminStatus(admin.id)}
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${getStatusColor(admin.status)} hover:opacity-80`}
                        >
                          {admin.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(admin)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAdmin(admin.id, admin)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            disabled={admin.isDefaultSuperAdmin}
                          >
                            <Trash2 className={`w-4 h-4 ${admin.isDefaultSuperAdmin ? 'opacity-50' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingAdmin ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแลใหม่'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อเต็ม</label>
                <input
                  {...register('name', { required: 'กรุณากรอกชื่อ' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                <select
                  {...register('role', { required: 'กรุณาเลือกบทบาท' })}
                  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="admin">ผู้ดูแล</option>
                  <option value="superadmin">ผู้ดูแลสูงสุด</option>
                </select>
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">หมายเลขโทรศัพท์</label>
              <input
                {...register('phone', { 
                  required: 'กรุณากรอกหมายเลขโทรศัพท์',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'หมายเลขโทรศัพท์ต้องมี 10 หลักเท่านั้น'
                  }
                })}
                type="tel"
                maxLength={10}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingAdmin ? 'รหัสผ่านใหม่ (ปล่อยว่างหากต้องการใช้รหัสเดิม)' : 'รหัสผ่าน'}
                </label>
                <div className="relative">
                  <input
                    {...register('password', editingAdmin ? {} : { 
                      required: 'กรุณากรอกรหัสผ่าน',
                      minLength: {
                        value: 6,
                        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="mt-1 block w-full pr-10 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    placeholder={editingAdmin ? 'ปล่อยว่างหากต้องการใช้รหัสผ่านเดิม' : ''}
                    disabled={editingAdmin?.isDefaultSuperAdmin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={editingAdmin?.isDefaultSuperAdmin}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {editingAdmin?.isDefaultSuperAdmin && (
                  <p className="text-sm text-gray-500 mt-1">ไม่สามารถเปลี่ยนรหัสผ่านของผู้ดูแลสูงสุดเริ่มต้นได้</p>
                )}
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingAdmin ? 'ยืนยันรหัสผ่านใหม่' : 'ยืนยันรหัสผ่าน'}
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', editingAdmin ? {
                      validate: value => !password || value === password || 'รหัสผ่านไม่ตรงกัน'
                    } : { 
                      required: 'กรุณายืนยันรหัสผ่าน',
                      validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="mt-1 block w-full pr-10 border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    disabled={editingAdmin?.isDefaultSuperAdmin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={editingAdmin?.isDefaultSuperAdmin}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
              </div>
            </div>


            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingAdmin ? 'อัปเดต' : 'สร้าง'}ผู้ดูแล
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminManagement;