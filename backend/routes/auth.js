const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { logLogin, logLogout } = require('../middleware/auditLogger');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId, userType = 'User') => {
  return jwt.sign({ userId, userType }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   GET /api/auth/verify
// @desc    Verify JWT token and return user data
// @access  Private
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const userId = req.user._id;
    
    // Check admin collection first
    let user = await Admin.findById(userId);
    
    // If not found in admin collection, check user collection
    if (!user) {
      user = await User.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || [],
      status: user.status,
      avatar: user.avatar,
      bio: user.bio
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register user (clients only)
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits').matches(/^[0-9]{10}$/).withMessage('Phone number must contain only digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, address, bankDetails, referralCode } = req.body;

    // Check if user exists
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check and validate referral code if provided
    let referringCodeHolder = null;
    let bonusCredits = 0;
    
    if (referralCode) {
      // Find user with this referral code
      referringCodeHolder = await User.findOne({ referralCode });
      
      if (!referringCodeHolder) {
        return res.status(400).json({ 
          message: 'Invalid referral code. Please try again with a valid code.'
        });
      }
      
      // Check if this is a temporary referral code holder (inactive user)
      const isTempCodeHolder = referringCodeHolder.status === 'inactive' && 
                            referringCodeHolder.phone.startsWith('refcode-');
      
      // Add bonus credits for the new user
      bonusCredits = 100;
    }

    // Create user (force role to client for public registration)
    user = new User({
      name,
      phone,
      password,
      role: 'client',
      address,
      bankDetails,
      credits: bonusCredits // Add bonus credits if referral code was used
    });

    // Don't generate referral code for new users - only admins can create referral codes
    // await user.generateReferralCode();
    
    // If referral code was used, handle the referral relationship
    if (referringCodeHolder) {
      // Check if this is a temporary referral code holder (inactive user created just for the code)
      const isTempCodeHolder = referringCodeHolder.status === 'inactive' && 
                            referringCodeHolder.phone.startsWith('refcode-');
      
      if (isTempCodeHolder) {
        // For temporary holders, just delete the temporary user after use
        await User.deleteOne({ _id: referringCodeHolder._id });
        console.log(`Deleted temporary referral code holder: ${referringCodeHolder._id}`);
      } else {
        // For real users who shared their code, update their stats
        // Set referredBy to the referral code holder's ID
        user.referredBy = referringCodeHolder._id;
        
        // Increment the referral count for the referrer
        referringCodeHolder.referralCount = (referringCodeHolder.referralCount || 0) + 1;
        
        // Delete the referral code after use (it's one-time use)
        referringCodeHolder.referralCode = null;
        
        // Save the updated referrer data
        await referringCodeHolder.save();
        console.log(`Updated existing user ${referringCodeHolder._id} after referral code use`);
      }
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id, 'User');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        credits: user.credits,
        referralCode: user.referralCode,
        referredBy: user.referredBy
      },
      message: referralCode ? `Registration successful! You received ${bonusCredits} bonus credits.` : 'Registration successful!'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', [
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ 
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { phone, password } = req.body;

    // Check admin collection only
    const admin = await Admin.findOne({ phone });
    
    if (!admin) {
      return res.status(200).json({ 
        success: false,
        message: 'Admin not found',
        field: 'phone'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await logLogin(admin, req, false);
      return res.status(200).json({ 
        success: false,
        message: 'Incorrect password',
        field: 'password'
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(200).json({ 
        success: false, 
        message: 'Account is not active' 
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log successful login
    await logLogin(admin, req, true);

    // Generate token
    const token = generateToken(admin._id, 'Admin');

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        lastLogin: admin.lastLogin,
        permissions: admin.permissions || []
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/client/login
// @desc    Client login
// @access  Public
router.post('/client/login', [
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ 
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { phone, password } = req.body;

    // Check user collection only
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(200).json({ 
        success: false,
        message: 'User not found',
        field: 'phone'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await logLogin(user, req, false);
      return res.status(200).json({ 
        success: false,
        message: 'Incorrect password',
        field: 'password'
      });
    }


    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await logLogin(user, req, true);

    // Check for pending notifications
    const pendingNotifications = await Notification.find({
      userId: user._id,
      isDisplayed: false
    }).populate('fromAdminId', 'name').sort({ createdAt: -1 });

    // Mark notifications as displayed
    if (pendingNotifications.length > 0) {
      await Notification.updateMany(
        { userId: user._id, isDisplayed: false },
        { isDisplayed: true }
      );
    }

    // Generate token
    const token = generateToken(user._id, 'User');

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        banMessage: user.banMessage,
        credits: user.credits,
        accountBalance: user.accountBalance,
        totalEarned: user.totalEarned,
        totalPurchases: user.totalPurchases,
        referralCode: user.referralCode,
        avatar: user.avatar,
        bio: user.bio,
        website: user.website,
        address: user.address,
        bankDetails: user.bankDetails,
        lastLogin: user.lastLogin,
        engagementMetrics: user.engagementMetrics
      },
      pendingNotifications: pendingNotifications.map(notif => ({
        id: notif._id,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        fromAdmin: notif.fromAdminId?.name || 'Admin',
        createdAt: notif.createdAt
      }))
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      banMessage: user.banMessage,
      credits: user.credits,
      accountBalance: user.accountBalance,
      totalEarned: user.totalEarned,
      todayEarnings: user.todayEarnings,
      weekEarnings: user.weekEarnings,
      totalPurchases: user.totalPurchases,
      referralCode: user.referralCode,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      address: user.address,
      bankDetails: user.bankDetails,
      engagementMetrics: user.engagementMetrics
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh token
// @access  Private
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const token = generateToken(req.user._id, req.user.userModel || 'User');
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Log the logout action
    await logLogout(req.user, req);
    
    // In a real app, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
