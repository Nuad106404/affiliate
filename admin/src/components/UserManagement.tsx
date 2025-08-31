import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, UserPlus, DollarSign, Circle, CreditCard, CheckCircle, Clock, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { usersAPI } from '../services/api';
import axios from 'axios';
import Modal from './common/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import Swal from 'sweetalert2';

interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'inactive';
  banMessage?: string;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountOwnerName: string;
  };
  credits: number;
  accountBalance: number;
  totalEarned: number;
  todayEarnings?: number;
  weekEarnings?: number;
  totalPurchases: number;
  bio?: string;
  website?: string;
  location?: string;
  engagementMetrics?: {
    visitors: number;
    likes: number;
    followers: number;
  };
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  password?: string;
}

// Memoized status indicator component to prevent unnecessary re-renders
const UserStatusIndicator = React.memo(({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
  return (
    <div className="flex items-center space-x-2">
      <Circle 
        className={`w-3 h-3 transition-colors duration-200 ${
          isOnline 
            ? 'text-green-500 fill-green-500' 
            : 'text-gray-400 fill-gray-400'
        }`}
      />
      <span className={`text-xs font-medium transition-colors duration-200 ${
        isOnline 
          ? 'text-green-600' 
          : 'text-gray-500'
      }`}>
        {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </span>
    </div>
  );
});

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [messages, setMessages] = useState<{ [key: string]: string }>({});
  const [banMessages, setBanMessages] = useState<{ [key: string]: string }>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditOperation, setCreditOperation] = useState<'add' | 'subtract'>('add');
  
  // Withdrawal management state
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedUserWithdrawals, setSelectedUserWithdrawals] = useState<any[]>([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  
  // Withdrawal edit state
  const [isEditWithdrawalModalOpen, setIsEditWithdrawalModalOpen] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);
  const [editWithdrawalData, setEditWithdrawalData] = useState({
    amount: 0,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountOwnerName: ''
    }
  });
  
  // Form state for user creation/editing
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'active',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      accountOwnerName: ''
    },
    credits: 0,
    accountBalance: 0,
    totalEarned: 0,
    totalPurchases: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    bio: '',
    website: '',
    location: '',
    engagementMetrics: {
      visitors: 0,
      likes: 0,
      followers: 0
    }
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  // Optimized socket event handlers using useCallback to prevent unnecessary re-renders
  const handleUserConnected = useCallback((userId: string) => {
    console.log('Admin received user-connected event for:', userId);
    setOnlineUsers(prev => new Set(prev).add(userId));
  }, []);

  const handleUserDisconnected = useCallback((userId: string) => {
    console.log('Admin received user-disconnected event for:', userId);
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  const handleOnlineUsersList = useCallback((userIds: string[]) => {
    console.log('Admin received online-users-list:', userIds);
    setOnlineUsers(new Set(userIds));
  }, []);

  // Memoized online status lookup for performance optimization
  const isUserOnline = useMemo(() => {
    return (userId: string) => onlineUsers.has(userId);
  }, [onlineUsers]);

  // Socket connection for real-time user status tracking
  useEffect(() => {
    if (socket) {
      console.log('Admin connecting to socket server, joining admin room with ID:', user?.id);
      // Join admin room to receive user status updates
      socket.emit('join-admin-room', user?.id);

      // Listen for user connection status updates with optimized handlers
      socket.on('user-connected', handleUserConnected);
      socket.on('user-disconnected', handleUserDisconnected);
      socket.on('online-users-list', handleOnlineUsersList);

      // Request current online users list
      console.log('Admin requesting current online users list');
      socket.emit('get-online-users');

      return () => {
        socket.off('user-connected', handleUserConnected);
        socket.off('user-disconnected', handleUserDisconnected);
        socket.off('online-users-list', handleOnlineUsersList);
      };
    }
  }, [socket, user?.id, handleUserConnected, handleUserDisconnected, handleOnlineUsersList]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    if (!token) {
      setError('Authentication token not available');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '10'); // Fixed limit for now
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      const { data } = await axios.get(`/api/users?${queryParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
      setLoading(false);
    }
  };

  // No need for client-side filtering as we're using API filtering
  const filteredUsers = users;

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const banMessage = banMessages[userId] || 'กรุณาติดต่อผู้ดูแลระบบ';
      
      await axios.put(`/api/users/${userId}`, 
        { 
          status: newStatus,
          banMessage: newStatus === 'inactive' ? banMessage : undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus, banMessage: newStatus === 'inactive' ? banMessage : undefined } : user
      ));
      
    } catch (err: any) {
      console.error('Error updating user status:', err);
      alert(err.response?.data?.message || 'Failed to update user status');
      // Refresh data to ensure consistency
      fetchUsers();
    }
  };

  const updateBanMessage = (userId: string, message: string) => {
    setBanMessages(prev => ({
      ...prev,
      [userId]: message
    }));
  };

  const submitBanMessage = async (userId: string) => {
    try {
      const banMessage = banMessages[userId] || '';
      
      await axios.put(`/api/users/${userId}`, 
        { banMessage },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, banMessage } : user
      ));
      
      // Clear the temporary message
      setBanMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[userId];
        return newMessages;
      });
      
      alert('บันทึกข้อความแบนสำเร็จ');
      
    } catch (err: any) {
      console.error('Error updating ban message:', err);
      alert(err.response?.data?.message || 'Failed to update ban message');
    }
  };

  const openCreditsModal = (user: User) => {
    setSelectedUser(user);
    setCreditAmount(0);
    setCreditOperation('add');
    setIsCreditsModalOpen(true);
  };

  // Withdrawal management functions
  const fetchUserWithdrawals = async (userId: string) => {
    setWithdrawalLoading(true);
    try {
      const response = await axios.get(`/api/users/withdrawals/all?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSelectedUserWithdrawals(response.data.withdrawals || []);
    } catch (error) {
      console.error('Error fetching user withdrawals:', error);
      setSelectedUserWithdrawals([]);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const openWithdrawalModal = (user: User) => {
    setSelectedUser(user);
    setIsWithdrawalModalOpen(true);
    fetchUserWithdrawals(user._id);
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: string, notes?: string, transactionId?: string) => {
    try {
      await axios.put(`/api/users/withdrawals/${withdrawalId}/status`, {
        status,
        notes,
        transactionId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      Swal.fire({
        title: 'สำเร็จ!',
        text: `การถอนเงิน${status === 'approved' ? 'อนุมัติ' : status === 'rejected' ? 'ปฏิเสธ' : 'เสร็จสิ้น'}เรียบร้อยแล้ว`,
        icon: 'success',
        confirmButtonColor: '#10b981'
      });

      // Refresh withdrawal list
      if (selectedUser) {
        fetchUserWithdrawals(selectedUser._id);
      }
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update withdrawal status',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const openEditWithdrawalModal = (withdrawal: any) => {
    setEditingWithdrawal(withdrawal);
    setEditWithdrawalData({
      amount: withdrawal.amount || 0,
      bankDetails: {
        bankName: withdrawal.bankDetails?.bankName || '',
        accountNumber: withdrawal.bankDetails?.accountNumber || '',
        accountOwnerName: selectedUser?.bankDetails?.accountOwnerName || selectedUser?.name || ''
      }
    });
    setIsEditWithdrawalModalOpen(true);
  };

  const updateWithdrawal = async () => {
    if (!editingWithdrawal) return;
    
    try {
      setLoading(true);
      await axios.put(`/api/users/withdrawals/${editingWithdrawal._id}`, {
        amount: editWithdrawalData.amount,
        bankDetails: editWithdrawalData.bankDetails
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      Swal.fire({
        title: 'Success!',
        text: 'Withdrawal updated successfully',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });

      setIsEditWithdrawalModalOpen(false);
      setEditingWithdrawal(null);
      
      // Refresh withdrawal list
      if (selectedUser) {
        fetchUserWithdrawals(selectedUser._id);
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update withdrawal',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddUserModal = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      phone: '',
      status: 'active',
      password: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      bankDetails: {
        accountNumber: '',
        bankName: '',
        accountOwnerName: ''
      },
      credits: 0,
      accountBalance: 0,
      totalEarned: 0,
      totalPurchases: 0,
      todayEarnings: 0,
      weekEarnings: 0,
      bio: '',
      website: '',
      location: '',
      engagementMetrics: {
        visitors: 0,
        likes: 0,
        followers: 0
      }
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      status: user.status,
      password: user.password || '', // Show current password in edit mode
      address: user.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      bankDetails: user.bankDetails || {
        accountNumber: '',
        bankName: '',
        accountOwnerName: ''
      },
      credits: user.credits || 0,
      accountBalance: user.accountBalance || 0,
      totalEarned: user.totalEarned || 0,
      totalPurchases: user.totalPurchases || 0,
      todayEarnings: user.todayEarnings || 0,
      weekEarnings: user.weekEarnings || 0,
      bio: user.bio || '',
      website: user.website || '',
      location: user.location || '',
      engagementMetrics: {
        visitors: user.engagementMetrics?.visitors || 0,
        likes: user.engagementMetrics?.likes || 0,
        followers: user.engagementMetrics?.followers || 0
      }
    });
    setIsUserModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested object updates for address, bankDetails, and engagementMetrics
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: parent === 'engagementMetrics' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const updateCredits = async () => {
    if (selectedUser && creditAmount > 0) {
      try {
        const { data } = await axios.post(`/api/users/${selectedUser._id}/credits`, 
          {
            amount: creditAmount,
            type: creditOperation
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Update local state with new credits amount
        setUsers(users.map(user => 
          user._id === selectedUser._id ? { ...user, credits: data.credits } : user
        ));
        
        setIsCreditsModalOpen(false);
      } catch (err: any) {
        console.error('Error updating credits:', err);
        alert(err.response?.data?.message || 'Failed to update credits');
      }
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Remove from local state
        setUsers(prev => prev.filter(user => user._id !== userId));
      } catch (err: any) {
        console.error('Error deleting user:', err);
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMessageChange = (userId: string, message: string) => {
    setMessages(prev => ({
      ...prev,
      [userId]: message
    }));
  };

  const sendMessage = async (userId: string) => {
    const message = messages[userId];
    if (!message || message.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Message',
        text: 'Please enter a message before sending.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      // Check if user is online
      const isUserCurrentlyOnline = onlineUsers.has(userId);
      
      if (isUserCurrentlyOnline) {
        // Send real-time message via socket
        const response = await axios.post('/api/messages/send', {
          userId,
          message: message.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'ส่งข้อความสำเร็จ!',
            text: 'ข้อความของคุณถูกส่งแล้ว',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Clear the message input
          setMessages(prev => ({
            ...prev,
            [userId]: ''
          }));
        }
      } else {
        // User is offline - store notification for when they login
        const response = await axios.post('/api/notifications/send', {
          userId,
          message: message.trim(),
          type: 'urgent_message',
          priority: 'high'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          Swal.fire({
            icon: 'info',
            title: 'ข้อความถูกบันทึกแล้ว!',
            text: 'ผู้ใช้ออฟไลน์ - ข้อความจะแสดงเมื่อเข้าสู่ระบบ',
            timer: 3000,
            showConfirmButton: false
          });
          
          // Clear the message input
          setMessages(prev => ({
            ...prev,
            [userId]: ''
          }));
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Send',
        text: error.response?.data?.message || 'Failed to send message. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const saveUser = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.status) {
        alert('Please fill all required fields');
        return;
      }
      
      setLoading(true);
      setError(null);
      // For edit mode
      if (isEditMode && selectedUser) {
        // Update user info including earnings
        const { data } = await axios.put(
          `/api/users/${selectedUser._id}`,
          {
            name: formData.name,
            phone: formData.phone,
            status: formData.status,
            address: formData.address,
            bankDetails: formData.bankDetails,
            credits: formData.credits,
            accountBalance: formData.accountBalance,
            totalEarned: formData.totalEarned,
            todayEarnings: formData.todayEarnings,
            weekEarnings: formData.weekEarnings,
            totalPurchases: formData.totalPurchases,
            engagementMetrics: formData.engagementMetrics,
            bio: formData.bio,
            website: formData.website,
            location: formData.location,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Update local state
        setUsers(prev => prev.map(user =>
          user._id === selectedUser._id ? { ...user, ...data } : user
        ));
        
      } else {
        // For add mode (all fields required)
        const { data } = await axios.post(
          '/api/users',
          {
            name: formData.name,
            phone: formData.phone,
            status: formData.status,
            password: formData.password,
            address: formData.address,
            bankDetails: formData.bankDetails,
            credits: formData.credits,
            accountBalance: formData.accountBalance,
            totalEarned: formData.totalEarned,
            todayEarnings: formData.todayEarnings,
            weekEarnings: formData.weekEarnings,
            totalPurchases: formData.totalPurchases,
            engagementMetrics: formData.engagementMetrics
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Add to local state if on first page
        if (currentPage === 1) {
          setUsers(prev => [data, ...prev].slice(0, 10));
        } else {
          // If not on first page, just refresh
          setCurrentPage(1);
        }
      }
      
      setIsUserModalOpen(false);
      setLoading(false);
      
    } catch (err: any) {
      setLoading(false);
      console.error('Error saving user:', err);
      
      // Show detailed validation errors if available
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((error: any) => error.msg).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || 'Failed to save user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:min-h-screen">
      <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-600">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <button 
          onClick={openAddUserModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <UserPlus className="w-4 h-4 mr-2" />
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Modern Search and Filters */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ อีเมล หรือเบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 text-sm"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 text-sm bg-white"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>พบผู้ใช้ทั้งหมด {totalUsers} คน</span>
              <span>หน้า {currentPage} จาก {totalPages}</span>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Modern Users Grid */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-6">
              {filteredUsers?.map((user) => (
                <div key={user._id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* User Info Section */}
                    <div className="lg:col-span-1">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                          <p className="text-sm text-gray-500">ID: {user._id.slice(-8)}</p>
                          <div className="mt-2">
                            <UserStatusIndicator 
                              userId={user._id} 
                              isOnline={isUserOnline(user._id)} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="mt-4 space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-500">เบอร์โทร:</span>
                          <span className="ml-2 font-medium text-gray-900">{user.phone}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">รหัสผ่าน:</span>
                          <span className="ml-2 font-medium text-gray-900">{user.password || 'ไม่มี'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions Section */}
                    <div className="lg:col-span-2">
                      {/* Message Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ส่งข้อความด่วน</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                            value={messages[user._id] || ''}
                            onChange={(e) => handleMessageChange(user._id, e.target.value)}
                            className="w-full pl-4 pr-12 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                          />
                          <button
                            onClick={() => sendMessage(user._id)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="ส่งข้อความ"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Ban Message Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความแบน</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            placeholder="กรุณาติดต่อผู้ดูแลระบบ"
                            value={banMessages[user._id] || user.banMessage || ''}
                            onChange={(e) => updateBanMessage(user._id, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                          />
                          <button
                            onClick={() => submitBanMessage(user._id)}
                            disabled={!banMessages[user._id] || banMessages[user._id] === user.banMessage}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            บันทึก
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status & Actions Section */}
                    <div className="lg:col-span-1">
                      {/* Status Toggle */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                        <select
                          value={user.status}
                          onChange={(e) => updateUserStatus(user._id, e.target.value as any)}
                          className={`w-full px-3 py-2 text-sm font-medium rounded-lg border-0 ${getStatusColor(user.status)} focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="active">ใช้งาน</option>
                          <option value="inactive">ไม่ใช้งาน</option>
                        </select>
                      </div>
                      
                      {/* Financial Info */}
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลการเงิน</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">เครดิต:</span>
                            <button
                              onClick={() => openCreditsModal(user)}
                              className="flex items-center text-blue-600 hover:text-blue-900 font-medium"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />{user.credits || 0}
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ยอดเงิน:</span>
                            <span className="font-medium">${user.accountBalance || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">รายได้วันนี้:</span>
                            <span className="font-medium text-green-600">${user.todayEarnings || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">รายได้สัปดาห์:</span>
                            <span className="font-medium">${user.weekEarnings || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => openWithdrawalModal(user)}
                          className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          ดูการถอนเงิน
                        </button>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditUserModal(user)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Add/Edit Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={isEditMode ? `แก้ไขผู้ใช้ - ${selectedUser?.name}` : 'เพิ่มผู้ใช้ใหม่'}
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          saveUser();
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          
          <div>
            <label className="block text-sm font-medium text-gray-700">เบอร์โทร</label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <input
              type="text"
              name="password"
              required={!isEditMode} // Required for new users only
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">สถานะ</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
          
          {/* Address Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลที่อยู่</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ถนน</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">เมือง</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">จังหวัด</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">ประเทศ</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Bank Details */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">รายละเอียดธนาคาร</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อธนาคาร</label>
                <select
                  name="bankDetails.bankName"
                  value={formData.bankDetails.bankName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">เลือกธนาคาร</option>
                  <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                  <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                  <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                  <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                  <option value="ธนาคารซีไอเอ็มบีไทย">ธนาคารซีไอเอ็มบีไทย</option>
                  <option value="ธนาคารทิเอ็มบีธนชาต">ธนาคารทิเอ็มบีธนชาต</option>
                  <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                  <option value="ธนาคารอิสลามแห่งประเทศไทย">ธนาคารอิสลามแห่งประเทศไทย</option>
                  <option value="ธนาคารเกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                  <option value="ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย">ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย</option>
                  <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร</option>
                  <option value="ธนาคารเมกะ สากลพาณิชย์">ธนาคารเมกะ สากลพาณิชย์</option>
                  <option value="ธนาคารแลนด์ แอนด์ เฮ้าส์">ธนาคารแลนด์ แอนด์ เฮ้าส์</option>
                  <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                  <option value="ธนาคารไทยเครดิต เพื่อรายย่อย">ธนาคารไทยเครดิต เพื่อรายย่อย</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">เลขที่บัญชี</label>
                <input
                  type="text"
                  name="bankDetails.accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อเจ้าของบัญชี</label>
                <input
                  type="text"
                  name="bankDetails.accountOwnerName"
                  value={formData.bankDetails.accountOwnerName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Financial Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลทางการเงิน</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">เครดิต</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ยอดเงินในบัญชี</label>
                <input
                  type="number"
                  step="0.01"
                  name="accountBalance"
                  value={formData.accountBalance}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">รายได้รวม (เดือนนี้)</label>
                <input
                  type="number"
                  step="0.01"
                  name="totalEarned"
                  value={formData.totalEarned}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">จำนวนการซื้อทั้งหมด</label>
                <input
                  type="number"
                  name="totalPurchases"
                  value={formData.totalPurchases}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Earnings Breakdown Section */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">รายละเอียดรายได้</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">รายได้วันนี้</label>
                  <input
                    type="number"
                    step="0.01"
                    name="todayEarnings"
                    value={formData.todayEarnings || 0}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">รายได้สัปดาห์นี้</label>
                  <input
                    type="number"
                    step="0.01"
                    name="weekEarnings"
                    value={formData.weekEarnings || 0}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Engagement Metrics */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">ตัวชี้วัดการมีส่วนร่วม</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ผู้เยี่ยมชม</label>
                <input
                  type="number"
                  name="engagementMetrics.visitors"
                  value={formData.engagementMetrics.visitors}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ไลค์</label>
                <input
                  type="number"
                  name="engagementMetrics.likes"
                  value={formData.engagementMetrics.likes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ผู้ติดตาม</label>
                <input
                  type="number"
                  name="engagementMetrics.followers"
                  value={formData.engagementMetrics.followers}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              {loading && <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isEditMode ? 'อัปเดตผู้ใช้' : 'เพิ่มผู้ใช้'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Withdrawal History Modal */}
      <Modal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        title={`ประวัติการถอนเงิน - ${selectedUser?.name}`}
      >
        <div className="space-y-6">
          {withdrawalLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : selectedUserWithdrawals.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีการถอนเงิน</h3>
              <p className="text-gray-600">ผู้ใช้รายนี้ยังไม่ได้ขอถอนเงิน</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedUserWithdrawals.map((withdrawal, index) => (
                <div key={withdrawal._id || index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
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
                          <Clock className="w-5 h-5 text-blue-600" />
                        ) : withdrawal.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-900 mr-2">
                            ${withdrawal.amount?.toFixed(2)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            withdrawal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          ขอถอนเมื่อ {new Date(withdrawal.requestDate || withdrawal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditWithdrawalModal(withdrawal)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไขการถอนเงิน"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {withdrawal.bankDetails && (
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="flex items-center mb-2">
                        <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">รายละเอียดธนาคาร</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ธนาคาร:</span>
                          <span className="ml-2 font-medium text-gray-900">{withdrawal.bankDetails.bankName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">บัญชี:</span>
                          <span className="ml-2 font-medium text-gray-900">****{withdrawal.bankDetails.accountNumber?.slice(-4)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawal.notes && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-blue-900">หมายเหตุผู้ดูแลระบบ:</span>
                          <p className="text-sm text-blue-800 mt-1">{withdrawal.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'อนุมัติการถอนเงิน',
                            text: 'คุณแน่ใจหรือไม่ว่าต้องการอนุมัติการถอนเงินนี้?',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonColor: '#10b981',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'ใช่ อนุมัติ!'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              updateWithdrawalStatus(withdrawal._id, 'approved');
                            }
                          });
                        }}
                        className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'ปฏิเสธการถอนเงิน',
                            input: 'textarea',
                            inputLabel: 'เหตุผลในการปฏิเสธ (ไม่จำเป็น)',
                            inputPlaceholder: 'กรอกเหตุผล...',
                            showCancelButton: true,
                            confirmButtonColor: '#ef4444',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'ปฏิเสธ'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              updateWithdrawalStatus(withdrawal._id, 'rejected', result.value);
                            }
                          });
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  )}

                  {withdrawal.status === 'approved' && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'ทำเครื่องหมายว่าเสร็จสิ้น',
                            input: 'text',
                            inputLabel: 'รหัสธุรกรรม (ไม่จำเป็น)',
                            inputPlaceholder: 'กรอกรหัสธุรกรรม...',
                            showCancelButton: true,
                            confirmButtonColor: '#10b981',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'ทำเครื่องหมายว่าเสร็จสิ้น'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              updateWithdrawalStatus(withdrawal._id, 'completed', undefined, result.value);
                            }
                          });
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        ทำเครื่องหมายว่าเสร็จสิ้น
                      </button>
                    </div>
                  )}

                  {withdrawal.processedDate && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <span>ดำเนินการเมื่อ {new Date(withdrawal.processedDate).toLocaleDateString()}</span>
                      {withdrawal.transactionId && (
                        <span className="font-mono">ID: {withdrawal.transactionId}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      
      {/* Credits Update Modal */}
      <Modal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        title={`อัปเดตเครดิต - ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">เครดิตปัจจุบัน</label>
            <p className="text-lg font-semibold">{selectedUser?.credits || 0}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">การดำเนินการ</label>
            <div className="mt-1 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="add"
                  checked={creditOperation === 'add'}
                  onChange={() => setCreditOperation('add')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">เพิ่มเครดิต</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="subtract"
                  checked={creditOperation === 'subtract'}
                  onChange={() => setCreditOperation('subtract')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">หักเครดิต</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">จำนวนเงินที่จะ{creditOperation === 'add' ? 'เพิ่ม' : 'หัก'}</label>
            <input
              type="number"
              min="0"
              value={creditAmount}
              onChange={(e) => setCreditAmount(Number(e.target.value))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsCreditsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ยกเลิก
            </button>
            <button
              onClick={updateCredits}
              disabled={creditAmount <= 0}
              className={`px-4 py-2 text-white rounded-md ${creditAmount <= 0 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              อัปเดตเครดิต
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            แสดง <span className="font-medium">{users.length}</span> จาก{" "}
            <span className="font-medium">{totalUsers}</span> ผู้ใช้
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Withdrawal Modal */}
      <Modal
        isOpen={isEditWithdrawalModalOpen}
        onClose={() => setIsEditWithdrawalModalOpen(false)}
        title={`แก้ไขการถอนเงิน - ${editingWithdrawal?.amount ? `$${editingWithdrawal.amount.toFixed(2)}` : ''}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเงินถอน
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editWithdrawalData.amount}
                  onChange={(e) => setEditWithdrawalData({
                    ...editWithdrawalData,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="pl-8 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อธนาคาร
                </label>
                <input
                  type="text"
                  value={editWithdrawalData.bankDetails.bankName}
                  onChange={(e) => setEditWithdrawalData({
                    ...editWithdrawalData,
                    bankDetails: {
                      ...editWithdrawalData.bankDetails,
                      bankName: e.target.value
                    }
                  })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกชื่อธนาคาร"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  value={editWithdrawalData.bankDetails.accountNumber}
                  onChange={(e) => setEditWithdrawalData({
                    ...editWithdrawalData,
                    bankDetails: {
                      ...editWithdrawalData.bankDetails,
                      accountNumber: e.target.value
                    }
                  })}
                  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกเลขที่บัญชี"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเจ้าของบัญชี
              </label>
              <input
                type="text"
                value={editWithdrawalData.bankDetails.accountOwnerName}
                onChange={(e) => setEditWithdrawalData({
                  ...editWithdrawalData,
                  bankDetails: {
                    ...editWithdrawalData.bankDetails,
                    accountOwnerName: e.target.value
                  }
                })}
                className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="กรอกชื่อเจ้าของบัญชี"
              />
            </div>

          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsEditWithdrawalModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={updateWithdrawal}
              disabled={loading || editWithdrawalData.amount <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              อัปเดตการถอนเงิน
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default UserManagement;