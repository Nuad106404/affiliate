const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Debug logging for token content
    console.log('Token decoded:', { userId: decoded.userId, userType: decoded.userType });
    
    // Check which model the user belongs to using userType from token if available
    let user;
    let userModel;
    
    if (decoded.userType === 'Admin') {
      user = await Admin.findById(decoded.userId);
      userModel = 'Admin';
    } else if (decoded.userType === 'User') {
      user = await User.findById(decoded.userId);
      userModel = 'User';
    } else {
      // For backward compatibility with old tokens that don't have userType
      // Check User model first (most common case)
      user = await User.findById(decoded.userId);
      if (user) {
        userModel = 'User';
      } else {
        // If not found in User model, check Admin model
        user = await Admin.findById(decoded.userId);
        userModel = user ? 'Admin' : 'User';
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }


    req.user = user;
    req.user.userModel = userModel;
    
    console.log('Auth middleware result:', { 
      userId: user._id, 
      userModel: userModel, 
      role: user.role 
    });
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SuperAdmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: `Permission denied. Required: ${permission}` });
    }

    next();
  };
};

// Multiple permissions middleware (user needs ALL permissions)
const requirePermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SuperAdmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has all required permissions
    if (!req.user.permissions) {
      return res.status(403).json({ message: 'No permissions assigned' });
    }

    const missingPermissions = permissions.filter(p => !req.user.permissions.includes(p));
    if (missingPermissions.length > 0) {
      return res.status(403).json({ 
        message: `Permission denied. Missing: ${missingPermissions.join(', ')}` 
      });
    }

    next();
  };
};

// Any permission middleware (user needs at least ONE permission)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SuperAdmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has at least one of the required permissions
    if (!req.user.permissions) {
      return res.status(403).json({ message: 'No permissions assigned' });
    }

    const hasPermission = permissions.some(p => req.user.permissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Permission denied. Required one of: ${permissions.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin', 'superadmin']);

// SuperAdmin only middleware
const requireSuperAdmin = requireRole(['superadmin']);

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  requirePermissions,
  requireAnyPermission,
  requireAdmin,
  requireSuperAdmin
};
