const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const AuditCleanup = require('../utils/auditCleanup');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');

// Get audit logs with pagination and filtering
router.get('/', 
  authMiddleware, 
  requireRole(['admin', 'superadmin']),
  auditMiddleware('VIEW', 'Audit Logs'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        severity,
        status,
        userId,
        startDate,
        endDate,
        search
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (action) filter.action = action;
      if (severity) filter.severity = severity;
      if (status) filter.status = status;
      if (userId) filter.userId = userId;
      
      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Search in details, userName, or resource
      if (search) {
        filter.$or = [
          { details: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { resource: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userId', 'name phone role', null, { strictPopulate: false }),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filter
      });

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงบันทึกการตรวจสอบ',
        error: error.message
      });
    }
  }
);

// Get audit log statistics
router.get('/statistics',
  authMiddleware,
  requireRole(['admin', 'superadmin']),
  auditMiddleware('VIEW', 'Audit Statistics'),
  async (req, res) => {
    try {
      const stats = await AuditCleanup.getLogStatistics();
      
      res.json({
        success: true,
        data: stats,
        message: 'ดึงสถิติบันทึกการตรวจสอบสำเร็จ'
      });

    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงสถิติบันทึกการตรวจสอบ',
        error: error.message
      });
    }
  }
);

// Manual cleanup of old audit logs (SuperAdmin only)
router.post('/cleanup',
  authMiddleware,
  requireRole(['superadmin']),
  auditMiddleware('DELETE', 'Audit Logs Cleanup'),
  async (req, res) => {
    try {
      const { days = 30 } = req.body;
      
      if (days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          message: 'จำนวนวันต้องอยู่ระหว่าง 1-365 วัน'
        });
      }
      
      const result = await AuditCleanup.cleanupOldLogs(days);
      
      if (result.success) {
        res.json({
          success: true,
          data: result,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error during manual cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการทำความสะอาดบันทึกการตรวจสอบ',
        error: error.message
      });
    }
  }
);

// Cleanup logs by severity (SuperAdmin only)
router.post('/cleanup/severity',
  authMiddleware,
  requireRole(['superadmin']),
  auditMiddleware('DELETE', 'Audit Logs Severity Cleanup'),
  async (req, res) => {
    try {
      const { severity, days = 7 } = req.body;
      
      if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
        return res.status(400).json({
          success: false,
          message: 'ระดับความรุนแรงต้องเป็น: low, medium, high, หรือ critical'
        });
      }
      
      const result = await AuditCleanup.cleanupBySeverity(severity, days);
      
      res.json({
        success: true,
        data: result,
        message: result.message
      });

    } catch (error) {
      console.error('Error during severity cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการทำความสะอาดบันทึกตามระดับความรุนแรง',
        error: error.message
      });
    }
  }
);

// Delete all audit logs (SuperAdmin only)
router.delete('/all',
  authMiddleware,
  requireRole(['superadmin']),
  auditMiddleware('DELETE', 'All Audit Logs'),
  async (req, res) => {
    try {
      const result = await AuditLog.deleteMany({});
      
      console.log(`🗑️ SuperAdmin deleted all audit logs: ${result.deletedCount} records`);
      
      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `ลบบันทึกการตรวจสอบทั้งหมด ${result.deletedCount} รายการสำเร็จ`
      });

    } catch (error) {
      console.error('Error deleting all audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบบันทึกการตรวจสอบทั้งหมด',
        error: error.message
      });
    }
  }
);

// Export audit logs (SuperAdmin only)
router.get('/export',
  authMiddleware,
  requireRole(['superadmin']),
  auditMiddleware('EXPORT', 'Audit Logs'),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .populate('userId', 'name phone role', null, { strictPopulate: false });

      if (format === 'csv') {
        // Convert to CSV format
        const csv = logs.map(log => ({
          วันที่: log.createdAt.toISOString(),
          ผู้ใช้: log.userName,
          บทบาท: log.userRole,
          การดำเนินการ: log.action,
          ทรัพยากร: log.resource,
          รายละเอียด: log.details,
          สถานะ: log.status,
          ระดับความรุนแรง: log.severity,
          'IP Address': log.ipAddress
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        
        // Simple CSV conversion
        const headers = Object.keys(csv[0] || {}).join(',');
        const rows = csv.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');
        
        res.send(csvContent);
      } else {
        res.json({
          success: true,
          data: logs,
          count: logs.length,
          exportDate: new Date().toISOString(),
          message: `ส่งออกบันทึกการตรวจสอบ ${logs.length} รายการสำเร็จ`
        });
      }

    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกบันทึกการตรวจสอบ',
        error: error.message
      });
    }
  }
);

module.exports = router;
