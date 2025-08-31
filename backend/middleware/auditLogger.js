const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Helper function to get client IP
const getClientIP = (req) => {
  // Check for real IP from various headers (proxy-aware)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  const trueClientIP = req.headers['true-client-ip']; // Akamai
  
  // Parse X-Forwarded-For header (comma-separated list, first is original client)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Check other common headers
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  if (trueClientIP) return trueClientIP;
  
  // Fall back to Express req.ip (works with trust proxy)
  let clientIP = req.ip || 
                 req.connection?.remoteAddress || 
                 req.socket?.remoteAddress ||
                 req.connection?.socket?.remoteAddress;
  
  // Convert IPv6 localhost to IPv4 for better readability
  if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
    clientIP = '127.0.0.1';
  }
  
  // If still localhost, try to get a more meaningful IP for development
  if (clientIP === '127.0.0.1' || clientIP === '::1') {
    // Try to get the actual network interface IP
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    // Look for non-internal IPv4 addresses
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return `${iface.address} (${interfaceName})`;
        }
      }
    }
    
    // Fallback to localhost with context
    return `127.0.0.1 (localhost)`;
  }
  
  return clientIP || '127.0.0.1';
};

// Helper function to determine severity based on action and resource
const getSeverity = (action, resource) => {
  // Skip audit logging for VIEW actions
  if (action === 'VIEW') return null;
  
  const highSeverityActions = ['DELETE', 'PERMISSION_CHANGE', 'ROLE_CHANGE'];
  const criticalSeverityActions = ['LOGIN_FAILED'];
  const mediumSeverityResources = ['Admin', 'User Account', 'System Settings'];
  
  if (criticalSeverityActions.includes(action)) return 'critical';
  if (highSeverityActions.includes(action)) return 'high';
  if (mediumSeverityResources.includes(resource)) return 'medium';
  return 'low';
};

// Main audit logging function
const createAuditLog = async (logData) => {
  try {
    const {
      userId,
      userModel = 'User',
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status = 'success',
      oldValues,
      newValues,
      sessionId
    } = logData;

    const severity = getSeverity(action, resource);
    
    // Skip logging if severity is null (VIEW actions)
    if (severity === null) {
      return;
    }

    await AuditLog.createLog({
      userId,
      userModel,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity,
      status,
      oldValues,
      newValues,
      sessionId
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// Middleware to automatically log requests
const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response
      setImmediate(async () => {
        try {
          if (req.user) {
            const user = req.user.userModel === 'Admin' 
              ? await Admin.findById(req.user._id)
              : await User.findById(req.user._id);
            
            if (user) {
              const status = res.statusCode >= 400 ? 'failed' : 'success';
              
              await createAuditLog({
                userId: user._id,
                userModel: req.user.userModel || 'User',
                userName: user.name,
                userRole: user.role,
                action,
                resource,
                resourceId: req.params.id,
                details: `${action} ${resource}${req.params.id ? ` (ID: ${req.params.id})` : ''}`,
                ipAddress: getClientIP(req),
                userAgent: req.get('User-Agent') || 'Unknown',
                status,
                sessionId: req.sessionID
              });
            }
          }
        } catch (error) {
          console.error('Audit middleware error:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Login audit logger
const logLogin = async (user, req, success = true) => {
  try {
    const userModel = user.constructor.modelName;
    const action = success ? 'LOGIN' : 'LOGIN_FAILED';
    const status = success ? 'success' : 'failed';
    
    await createAuditLog({
      userId: user._id,
      userModel,
      userName: user.name,
      userRole: user.role,
      action,
      resource: 'Authentication',
      details: success 
        ? `เข้าสู่ระบบสำเร็จ ${user.role} ` 
        : `เข้าสู่ระบบไม่สำเร็จ ${user.phone}`,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status,
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// Logout audit logger
const logLogout = async (user, req) => {
  try {
    const userModel = user.constructor.modelName || user.userModel || 'User';
    
    await createAuditLog({
      userId: user._id,
      userModel,
      userName: user.name,
      userRole: user.role,
      action: 'LOGOUT',
      resource: 'Authentication',
      details: `ออกจากระบบสำเร็จ ${user.role}`,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status: 'success',
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Logout audit logging failed:', error);
  }
};

// Admin creation audit logger
const logAdminCreation = async (createdBy, newAdmin, req) => {
  try {
    await createAuditLog({
      userId: createdBy._id,
      userModel: 'Admin',
      userName: createdBy.name,
      userRole: createdBy.role,
      action: 'CREATE',
      resource: 'Admin',
      resourceId: newAdmin._id.toString(),
      details: `Created new ${newAdmin.role} user: ${newAdmin.name} (${newAdmin.phone})`,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status: 'success',
      newValues: {
        name: newAdmin.name,
        phone: newAdmin.phone,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      },
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Admin creation audit logging failed:', error);
  }
};

// Admin update audit logger
const logAdminUpdate = async (updatedBy, admin, oldValues, newValues, req) => {
  try {
    await createAuditLog({
      userId: updatedBy._id,
      userModel: 'Admin',
      userName: updatedBy.name,
      userRole: updatedBy.role,
      action: 'UPDATE',
      resource: 'Admin',
      resourceId: admin._id.toString(),
      details: `Updated admin user: ${admin.name} (${admin.phone})`,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status: 'success',
      oldValues,
      newValues,
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Admin update audit logging failed:', error);
  }
};

// Admin deletion audit logger
const logAdminDeletion = async (deletedBy, admin, req) => {
  try {
    await createAuditLog({
      userId: deletedBy._id,
      userModel: 'Admin',
      userName: deletedBy.name,
      userRole: deletedBy.role,
      action: 'DELETE',
      resource: 'Admin',
      resourceId: admin._id.toString(),
      details: `Deleted admin user: ${admin.name} (${admin.phone})`,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      status: 'success',
      oldValues: {
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
      },
      sessionId: req.sessionID
    });
  } catch (error) {
    console.error('Admin deletion audit logging failed:', error);
  }
};

module.exports = {
  createAuditLog,
  auditMiddleware,
  logLogin,
  logLogout,
  logAdminCreation,
  logAdminUpdate,
  logAdminDeletion,
  getClientIP
};
