const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const { authMiddleware, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar (once only)
// @access  Private
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has an avatar (can only upload once)
    if (user.avatar && user.avatar !== '/default-avatar.svg') {
      // Delete the uploaded file since we're rejecting it
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting rejected file:', err);
        });
      }
      return res.status(400).json({ message: 'You can only upload a profile picture once.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail(),
  body('bio').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, bio, address, bankDetails } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (bio) updateFields.bio = bio;
    if (address) updateFields.address = address;
    if (bankDetails) updateFields.bankDetails = bankDetails;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/withdraw
// @desc    Request withdrawal from account balance
// @access  Private
router.post('/withdraw', authMiddleware, [
  body('amount').isNumeric().withMessage('Amount must be a number').custom(value => {
    if (value <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    if (user.accountBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check if user has bank details
    if (!user.bankDetails || !user.bankDetails.accountNumber || !user.bankDetails.bankName) {
      return res.status(400).json({ message: 'Bank details required for withdrawal' });
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      userId: user._id,
      amount: amount,
      bankDetails: {
        accountNumber: user.bankDetails.accountNumber,
        bankName: user.bankDetails.bankName,
        accountHolderName: user.bankDetails.accountHolderName || user.name
      },
      status: 'pending'
    });

    await withdrawal.save();

    // Deduct amount from account balance
    user.accountBalance = Math.max(0, user.accountBalance - amount);
    await user.save();

    res.json({ 
      message: 'Withdrawal request submitted successfully',
      newBalance: user.accountBalance,
      withdrawnAmount: amount,
      withdrawalId: withdrawal._id
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/withdrawals
// @desc    Get user's withdrawal history
// @access  Private
router.get('/withdrawals', authMiddleware, async (req, res) => {
  console.log('=== WITHDRAWAL ENDPOINT HIT ===');
  console.log('Withdrawal history request:', {
    userId: req.user._id,
    userModel: req.user.userModel,
    userType: req.user.userModel,
    role: req.user.role
  });
  
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;

    console.log('Executing withdrawal query with:', query);

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('processedBy', 'name')
      .lean();

    const total = await Withdrawal.countDocuments(query);

    console.log(`Found ${withdrawals.length} withdrawals for user ${req.user._id}`);
    
    res.json({
      withdrawals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, phone, status, address, bankDetails, credits, accountBalance, totalEarned, todayEarnings, weekEarnings, totalPurchases, bio, website, location, engagementMetrics, password } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (status) updateFields.status = status;
    if (req.body.banMessage !== undefined) updateFields.banMessage = req.body.banMessage;
    if (credits !== undefined) updateFields.credits = credits;
    if (password) updateFields.password = password;
    if (address) updateFields.address = address;
    if (bankDetails) updateFields.bankDetails = bankDetails;
    if (accountBalance !== undefined) updateFields.accountBalance = accountBalance;
    if (totalEarned !== undefined) updateFields.totalEarned = totalEarned;
    if (todayEarnings !== undefined) updateFields.todayEarnings = todayEarnings;
    if (weekEarnings !== undefined) updateFields.weekEarnings = weekEarnings;
    if (totalPurchases !== undefined) updateFields.totalPurchases = totalPurchases;
    if (bio !== undefined) updateFields.bio = bio;
    if (website !== undefined) updateFields.website = website;
    if (location !== undefined) updateFields.location = location;
    if (engagementMetrics) updateFields.engagementMetrics = engagementMetrics;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private/Admin
router.post('/', requireAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, status, address, bankDetails, credits, accountBalance, totalEarned, todayEarnings, weekEarnings, totalPurchases, bio, website, location, engagementMetrics } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Create new user
    const user = new User({
      name,
      phone,
      password,
      status: status || 'active',
      address: address || {},
      bankDetails: bankDetails || {},
      credits: credits || 0,
      accountBalance: accountBalance || 0,
      totalEarned: totalEarned || 0,
      todayEarnings: todayEarnings || 0,
      weekEarnings: weekEarnings || 0,
      totalPurchases: totalPurchases || 0,
      bio: bio || '',
      website: website || '',
      location: location || '',
      engagementMetrics: engagementMetrics || {
        visitors: 0,
        likes: 0,
        followers: 0
      }
    });

    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (SuperAdmin only)
// @access  Private/SuperAdmin
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/credits
// @desc    Add/Remove credits (Admin only)
// @access  Private/Admin
router.post('/:id/credits', requireAdmin, [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['add', 'remove']).withMessage('Type must be add or remove')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, type } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (type === 'add') {
      user.credits += amount;
    } else {
      user.credits = Math.max(0, user.credits - amount);
    }

    await user.save();
    res.json({ credits: user.credits });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   GET /api/users/withdrawals/all
// @desc    Get all withdrawals (Admin only)
// @access  Private/Admin
router.get('/withdrawals/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name phone')
      .populate('processedBy', 'name')
      .lean();

    const total = await Withdrawal.countDocuments(query);

    res.json({
      withdrawals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/withdrawals/:id/status
// @desc    Update withdrawal status (Admin only)
// @access  Private/Admin
router.put('/withdrawals/:id/status', requireAdmin, [
  body('status').isIn(['pending', 'approved', 'rejected', 'completed']).withMessage('Invalid status'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes, transactionId } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    // Update withdrawal
    withdrawal.status = status;
    withdrawal.processedBy = req.user._id;
    withdrawal.processedDate = new Date();
    if (notes) withdrawal.notes = notes;
    if (transactionId) withdrawal.transactionId = transactionId;

    await withdrawal.save();

    // If rejected, refund the amount to user's account
    if (status === 'rejected') {
      const user = await User.findById(withdrawal.userId);
      if (user) {
        user.accountBalance += withdrawal.amount;
        await user.save();
      }
    }

    res.json(withdrawal);
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
