const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { logAdminCreation, logAdminUpdate, logAdminDeletion } = require('../middleware/auditLogger');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   POST /api/admin/register-admin
// @desc    Register admin user (superadmin only)
// @access  Private/SuperAdmin
router.post('/register-admin', requireSuperAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits').matches(/^[0-9]{10}$/).withMessage('Phone number must contain only digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'superadmin']).withMessage('Role must be admin or superadmin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, role } = req.body;

    // Check if user exists in either collection
    let user = await User.findOne({ phone });
    let admin = await Admin.findOne({ phone });
    if (user || admin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user
    const newAdmin = new Admin({
      name,
      phone,
      password,
      role,
      status: 'active',
      permissions: req.body.permissions || []
    });

    await newAdmin.save();

    // Log admin creation
    const createdBy = await Admin.findById(req.user._id);
    if (createdBy) {
      await logAdminCreation(createdBy, newAdmin, req);
    }

    // Generate token
    const token = generateToken(newAdmin._id);

    res.status(201).json({
      token,
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        phone: newAdmin.phone,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts
    ] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find()
        .populate('customer', 'name email')
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find()
        .sort({ sales: -1 })
        .limit(5)
        .select('name sales price')
    ]);

    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      topProducts
    };

    res.json(stats);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system analytics
// @access  Private/Admin
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      userGrowth,
      revenueAnalytics,
      orderAnalytics,
      affiliateStats
    ] = await Promise.all([
      User.aggregate([
        { $match: { ...dateFilter, role: 'client' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Affiliate.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCommissions: { $sum: '$totalCommission' }
          }
        }
      ])
    ]);

    res.json({
      userGrowth,
      revenueAnalytics,
      orderAnalytics,
      affiliateStats
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get('/users/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          totalCredits: { $sum: '$credits' },
          totalSpent: { $sum: '$totalSpent' }
        }
      }
    ]);

    const statusStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      roleStats: stats,
      statusStats
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/financial-overview
// @desc    Get financial overview
// @access  Private/Admin
router.get('/financial-overview', requireAdmin, async (req, res) => {
  try {
    const [
      totalRevenue,
      totalCommissions,
      totalCreditsIssued,
      revenueByMonth
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { 'affiliate.commission': { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$affiliate.commission' } } }
      ]),
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$credits' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { 
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCommissions: totalCommissions[0]?.total || 0,
      totalCreditsIssued: totalCreditsIssued[0]?.total || 0,
      revenueByMonth
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/system-settings
// @desc    Get system settings
// @access  Private/SuperAdmin
router.get('/system-settings', requireSuperAdmin, async (req, res) => {
  try {
    // This would typically come from a settings collection
    const settings = {
      siteName: 'Affiliate Marketing Platform',
      siteDescription: 'Your premier affiliate marketing destination',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxFileSize: 10, // MB
      sessionTimeout: 30, // minutes
      commissionRates: {
        default: 10,
        premium: 15,
        vip: 20
      }
    };

    res.json(settings);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/system-settings
// @desc    Update system settings
// @access  Private/SuperAdmin
router.put('/system-settings', requireSuperAdmin, async (req, res) => {
  try {
    // In a real app, you'd update a settings collection
    const updatedSettings = req.body;
    
    // Validate settings here
    res.json({ message: 'Settings updated successfully', settings: updatedSettings });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs (superadmin only)
// @access  Private (SuperAdmin)
router.get('/audit-logs', requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const severity = req.query.severity;
    const status = req.query.status;
    const dateRange = req.query.dateRange || '7d';

    // Build query filters
    const query = {};
    
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    const now = new Date();
    let startDate;
    switch (dateRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    query.createdAt = { $gte: startDate };

    // Get total count for pagination
    const total = await AuditLog.countDocuments(query);
    
    // Fetch audit logs from database
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      timestamp: log.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      userId: log.userId.toString(),
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      resource: log.resource,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      severity: log.severity,
      status: log.status
    }));

    res.json({
      logs: formattedLogs,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total,
        itemsPerPage: limit
      },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/admins
// @desc    Get all admin users (superadmin only)
// @access  Private (SuperAdmin)
router.get('/admins', requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    
    const formattedAdmins = admins.map(admin => ({
      id: admin._id,
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
      permissions: admin.permissions || [],
      lastLogin: admin.lastLogin ? admin.lastLogin.toISOString() : 'Never',
      createdAt: admin.createdAt.toISOString().split('T')[0],
      isDefaultSuperAdmin: admin.isDefaultSuperAdmin || false
    }));

    res.json(formattedAdmins);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/admins/:id
// @desc    Update admin user (superadmin only)
// @access  Private (SuperAdmin)
router.put('/admins/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, phone, role, permissions, password } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent password change for default superadmin
    if (admin.isDefaultSuperAdmin && password) {
      return res.status(403).json({ message: 'Cannot change password of default superadmin' });
    }

    // Store old values for audit log
    const oldValues = {
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      permissions: admin.permissions,
      passwordChanged: !!password
    };

    // Update admin fields
    admin.name = name || admin.name;
    admin.phone = phone || admin.phone;
    admin.role = role || admin.role;
    admin.permissions = permissions || admin.permissions;
    
    // Update password if provided
    if (password && password.trim() !== '') {
      admin.password = password;
    }

    await admin.save();

    // Log admin update
    const updatedBy = await Admin.findById(req.user._id);
    if (updatedBy) {
      const newValues = {
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
      };
      await logAdminUpdate(updatedBy, admin, oldValues, newValues, req);
    }

    res.json({
      id: admin._id,
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
      permissions: admin.permissions
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (superadmin only)
// @access  Private (SuperAdmin)
router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    // Check both collections for the user
    let user = await User.findById(req.params.id);
    let isAdmin = false;
    
    if (!user) {
      user = await Admin.findById(req.params.id);
      isAdmin = true;
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of default superadmin
    if (user.isDefaultSuperAdmin) {
      return res.status(403).json({ message: 'Cannot delete default superadmin user' });
    }

    // Log admin deletion before deleting
    if (isAdmin) {
      const deletedBy = await Admin.findById(req.user._id);
      if (deletedBy) {
        await logAdminDeletion(deletedBy, user, req);
      }
    }

    // Delete user avatar file if exists (for regular users)
    if (!isAdmin && user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      fs.unlink(avatarPath, (err) => {
        if (err) {
          console.error('Error deleting avatar file:', err);
        } else {
          console.log('Deleted avatar file:', avatarPath);
        }
      });
    }

    // Delete from appropriate collection
    if (isAdmin) {
      await Admin.findByIdAndDelete(req.params.id);
    } else {
      await User.findByIdAndDelete(req.params.id);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
