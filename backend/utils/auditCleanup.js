const AuditLog = require('../models/AuditLog');

/**
 * Manual cleanup utility for audit logs
 * Removes audit logs older than specified days
 */
class AuditCleanup {
  
  /**
   * Clean up audit logs older than specified days (MANUAL ONLY)
   * @param {number} days - Number of days to retain (default: 30)
   * @returns {Object} Cleanup result
   */
  static async cleanupOldLogs(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      console.log(`🧹 เริ่มทำความสะอาดบันทึกการตรวจสอบที่เก่ากว่า ${days} วัน...`);
      console.log(`📅 วันที่ตัดขาด: ${cutoffDate.toISOString()}`);
      
      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      console.log(`✅ ทำความสะอาดเสร็จสิ้น: ลบบันทึก ${result.deletedCount} รายการ`);
      
      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        message: `ลบบันทึกการตรวจสอบ ${result.deletedCount} รายการที่เก่ากว่า ${days} วัน`
      };
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการทำความสะอาดบันทึกการตรวจสอบ:', error);
      return {
        success: false,
        error: error.message,
        message: 'เกิดข้อผิดพลาดในการทำความสะอาดบันทึกการตรวจสอบ'
      };
    }
  }
  
  /**
   * Get statistics about audit logs
   * @returns {Object} Statistics
   */
  static async getLogStatistics() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      const [
        totalLogs,
        logsLast30Days,
        logsLast7Days,
        logsLast24Hours,
        oldLogs
      ] = await Promise.all([
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        AuditLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        AuditLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        AuditLog.countDocuments({ createdAt: { $lt: thirtyDaysAgo } })
      ]);
      
      return {
        totalLogs,
        logsLast30Days,
        logsLast7Days,
        logsLast24Hours,
        oldLogs,
        retentionPolicy: 'เก็บถาวร (Manual Cleanup Only)',
        lastUpdated: now.toISOString()
      };
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงสถิติบันทึกการตรวจสอบ:', error);
      throw error;
    }
  }
  
  /**
   * Clean up logs by severity level
   * @param {string} severity - Severity level to clean up
   * @param {number} days - Days to retain
   */
  static async cleanupBySeverity(severity, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await AuditLog.deleteMany({
        severity: severity,
        createdAt: { $lt: cutoffDate }
      });
      
      console.log(`🧹 ลบบันทึกระดับ ${severity} จำนวน ${result.deletedCount} รายการ`);
      
      return {
        success: true,
        deletedCount: result.deletedCount,
        severity,
        days,
        message: `ลบบันทึกระดับ ${severity} จำนวน ${result.deletedCount} รายการที่เก่ากว่า ${days} วัน`
      };
      
    } catch (error) {
      console.error(`เกิดข้อผิดพลาดในการลบบันทึกระดับ ${severity}:`, error);
      throw error;
    }
  }
}

module.exports = AuditCleanup;
