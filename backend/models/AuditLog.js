const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Admin']
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['client', 'admin', 'superadmin', 'system']
  },
  
  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'CREATE', 'UPDATE', 'DELETE', 'VIEW',
      'REGISTER', 'PASSWORD_CHANGE',
      'PERMISSION_CHANGE', 'ROLE_CHANGE',
      'BACKUP', 'RESTORE', 'EXPORT', 'IMPORT',
      'TEST'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String
  },
  details: {
    type: String,
    required: true
  },
  
  // Request Information
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  
  // Metadata
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  
  // Additional Data
  oldValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Session Information
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Audit logs are kept permanently - no TTL index or automatic deletion
// TTL index disabled to prevent automatic deletion

// Ensure no TTL indexes are created on startup
auditLogSchema.pre('init', function() {
  // Remove any TTL indexes that might be recreated
  this.collection.dropIndex('createdAt_1').catch(() => {
    // Ignore error if index doesn't exist
  });
});

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
