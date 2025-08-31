const cron = require('node-cron');
const AuditLog = require('../models/AuditLog');

/**
 * Audit Log Retention Job
 * Runs daily at 2 AM to clean up audit logs older than 30 days
 * This ensures logs are kept for exactly 30 days without automatic MongoDB TTL deletion
 */
class AuditLogRetentionJob {
  
  static start() {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldLogs();
    }, {
      scheduled: true,
      timezone: "Asia/Bangkok"
    });
    
    console.log('🕐 Audit log retention job scheduled (daily at 2:00 AM)');
  }
  
  static async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log(`🧹 เริ่มทำความสะอาดบันทึกการตรวจสอบที่เก่ากว่า 30 วัน...`);
      console.log(`📅 วันที่ตัดขาด: ${thirtyDaysAgo.toISOString()}`);
      
      const result = await AuditLog.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      console.log(`✅ ทำความสะอาดเสร็จสิ้น: ลบบันทึก ${result.deletedCount} รายการ`);
      
      // Log the cleanup action itself
      await AuditLog.create({
        userId: null,
        userModel: 'System',
        userName: 'System',
        userRole: 'system',
        action: 'DELETE',
        resource: 'Audit Logs',
        details: `ระบบทำความสะอาดบันทึกการตรวจสอบอัตโนมัติ: ลบ ${result.deletedCount} รายการที่เก่ากว่า 30 วัน`,
        ipAddress: '127.0.0.1',
        userAgent: 'System Cron Job',
        severity: 'low',
        status: 'success',
        sessionId: 'system-cleanup'
      });
      
      return result.deletedCount;
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการทำความสะอาดบันทึกการตรวจสอบ:', error);
      
      // Log the error
      try {
        await AuditLog.create({
          userId: null,
          userModel: 'System',
          userName: 'System',
          userRole: 'system',
          action: 'DELETE',
          resource: 'Audit Logs',
          details: `เกิดข้อผิดพลาดในการทำความสะอาดบันทึกการตรวจสอบ: ${error.message}`,
          ipAddress: '127.0.0.1',
          userAgent: 'System Cron Job',
          severity: 'high',
          status: 'failed',
          sessionId: 'system-cleanup'
        });
      } catch (logError) {
        console.error('Failed to log cleanup error:', logError);
      }
      
      throw error;
    }
  }
  
  // Manual trigger for testing
  static async runNow() {
    console.log('🔧 Manual trigger: Running audit log cleanup...');
    return await this.cleanupOldLogs();
  }
  
  // Get retention status
  static async getRetentionStatus() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const [totalLogs, oldLogs] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $lt: thirtyDaysAgo } })
      ]);
      
      return {
        totalLogs,
        oldLogs,
        retentionPolicy: '30 วัน (Manual Cleanup)',
        nextCleanup: 'ทุกวันเวลา 02:00 น.',
        lastChecked: now.toISOString()
      };
      
    } catch (error) {
      console.error('Error getting retention status:', error);
      throw error;
    }
  }
}

module.exports = AuditLogRetentionJob;
