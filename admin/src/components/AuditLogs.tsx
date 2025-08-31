import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, AlertTriangle, User, Settings, Database, Trash2 } from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';

interface AuditLog {
  _id: string;
  createdAt: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'warning';
  oldValues?: any;
  newValues?: any;
  sessionId?: string;
  errorMessage?: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      } else {
        // Fallback to mock data if API fails
        setLogs([
          {
            _id: '1',
            createdAt: '2024-01-20 14:30:15',
            userId: 'admin-1',
            userName: 'John Admin',
            userRole: 'admin',
            action: 'CREATE',
            resource: 'Product',
            details: 'Created new product: Premium Marketing Course',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            severity: 'low',
            status: 'success'
          },
          {
            _id: '2',
            createdAt: '2024-01-20 14:25:42',
            userId: 'superadmin-1',
            userName: 'Super Admin',
            userRole: 'superadmin',
            action: 'UPDATE',
            resource: 'Admin Management',
            details: 'Created new admin user with permissions',
            ipAddress: '192.168.1.50',
            userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            severity: 'medium',
            status: 'success'
          },
          {
            _id: '3',
            createdAt: '2024-01-20 14:20:18',
            userId: 'user-123',
            userName: 'Unknown User',
            userRole: 'client',
            action: 'LOGIN_FAILED',
            resource: 'Authentication',
            details: 'Failed login attempt with invalid credentials',
            ipAddress: '203.0.113.45',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            severity: 'high',
            status: 'failed'
          },
          {
            _id: '4',
            createdAt: '2024-01-20 14:15:33',
            userId: 'admin-2',
            userName: 'Sarah Manager',
            userRole: 'admin',
            action: 'DELETE',
            resource: 'User Account',
            details: 'Deleted user account: mike.wilson@example.com',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            severity: 'high',
            status: 'success'
          },
          {
            _id: '5',
            createdAt: '2024-01-20 14:10:07',
            userId: 'system',
            userName: 'System',
            userRole: 'system',
            action: 'BACKUP',
            resource: 'Database',
            details: 'Automated database backup completed successfully',
            ipAddress: 'localhost',
            userAgent: 'System Process',
            severity: 'low',
            status: 'success'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
    }

    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const exportLogs = () => {
    const csvContent = [
      ['เวลา', 'ผู้ใช้', 'บทบาท', 'การกระทำ', 'ทรัพยากร', 'รายละเอียด', 'ที่อยู่ IP', 'ความรุนแรง', 'สถานะ'],
      ...filteredLogs.map(log => [
        log.createdAt,
        log.userName,
        log.userRole,
        log.action,
        log.resource,
        log.details,
        log.ipAddress,
        log.severity,
        log.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const deleteAllLogs = async () => {
    setDeleteAllLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/audit-logs/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs([]);
        setShowDeleteAllModal(false);
        alert(`ลบบันทึกการตรวจสอบทั้งหมด ${data.deletedCount} รายการสำเร็จ`);
      } else {
        alert('เกิดข้อผิดพลาดในการลบบันทึกการตรวจสอบ');
      }
    } catch (error) {
      console.error('Error deleting all audit logs:', error);
      alert('เกิดข้อผิดพลาดในการลบบันทึกการตรวจสอบ');
    }
    setDeleteAllLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) return User;
    if (action.includes('SYSTEM') || action.includes('BACKUP')) return Database;
    if (action.includes('UPDATE') || action.includes('MODIFY')) return Settings;
    return Eye;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">บันทึกการตรวจสอบ</h1>
            <p className="text-gray-600">การติดตามกิจกรรมระบบและความปลอดภัย</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">24 ชั่วโมงที่ผ่านมา</option>
              <option value="7d">7 วันที่ผ่านมา</option>
              <option value="30d">30 วันที่ผ่านมา</option>
              <option value="90d">90 วันที่ผ่านมา</option>
            </select>
            <button
              onClick={exportLogs}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ลบทั้งหมด
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาบันทึก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ระดับความรุนแรงทั้งหมด</option>
            <option value="critical">วิกฤต</option>
            <option value="high">สูง</option>
            <option value="medium">ปานกลาง</option>
            <option value="low">ต่ำ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="success">สำเร็จ</option>
            <option value="failed">ล้มเหลว</option>
            <option value="warning">คำเตือน</option>
          </select>
        </div>

        {/* Audit Logs Table */}
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
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ใช้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การกระทำ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ความรุนแรง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ที่อยู่ IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {log.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ActionIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                              <div className="text-sm text-gray-500">{log.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{log.action}</div>
                          <div className="text-sm text-gray-500">{log.resource}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailsModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Log Details Modal */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">รายละเอียดบันทึกการตรวจสอบ</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">เวลา</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.createdAt}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ผู้ใช้</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userRole})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">การกระทำ</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ทรัพยากร</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.resource}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ที่อยู่ IP</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLog.details}</p>
                </div>

                {/* User Agent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">ตัวแทนผู้ใช้</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono break-all">{selectedLog.userAgent}</p>
                </div>

                {/* Session ID */}
                {selectedLog.sessionId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสเซสชัน</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.sessionId}</p>
                  </div>
                )}

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ข้อความผิดพลาด</label>
                    <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded-md">{selectedLog.errorMessage}</p>
                  </div>
                )}

                {/* Old Values */}
                {selectedLog.oldValues && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ค่าก่อนหน้า</label>
                    <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}

                {/* New Values */}
                {selectedLog.newValues && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ค่าใหม่</label>
                    <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">ลบบันทึกการตรวจสอบทั้งหมด</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    คุณแน่ใจหรือไม่ที่จะลบบันทึกการตรวจสอบทั้งหมด? การกระทำนี้ไม่สามารถยกเลิกได้
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteAllModal(false)}
                      disabled={deleteAllLoading}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors flex-1"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={deleteAllLogs}
                      disabled={deleteAllLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex-1 flex items-center justify-center"
                    >
                      {deleteAllLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'ลบทั้งหมด'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">เหตุการณ์ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">การกระทำที่ล้มเหลว</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(log => log.status === 'failed').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ความรุนแรงสูง</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">ผู้ใช้ที่ไม่ซ้ำ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredLogs.map(log => log.userId)).size}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;