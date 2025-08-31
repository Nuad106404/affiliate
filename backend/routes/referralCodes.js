const express = require('express');
const User = require('../models/User');
const { requireAdmin, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @route    GET /api/referral-codes
 * @desc     Get all referral codes
 * @access   Admin only
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { 
      referralCode: { $exists: true, $ne: null }
    };

    if (search) {
      query.referralCode = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('_id name phone referralCode createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    const referralCodes = users.map(user => ({
      id: user._id,
      code: user.referralCode,
      userName: user.name,
      phone: user.phone,
      createdAt: user.createdAt.toISOString().slice(0, 16).replace('T', ' ')
    }));

    res.json({
      referralCodes,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
      total: totalUsers
    });
  } catch (error) {
    console.error('Error fetching referral codes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route    POST /api/referral-codes/generate
 * @desc     Generate new referral codes
 * @access   Admin only
 */
router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { count = 1 } = req.body;
    
    if (count < 1 || count > 100) {
      return res.status(400).json({ message: 'Count must be between 1 and 100' });
    }
    
    const generatedCodes = [];
    
    for (let i = 0; i < count; i++) {
      // Create a user to store the referral code in MongoDB
      const tempUser = new User({
        name: `Referral Code Holder`,
        phone: `refcode-${Date.now()}-${i}`,  // Unique phone to avoid duplicates
        password: 'temporary-' + Math.random().toString(36).substring(2, 10),
        role: 'client',
        status: 'inactive',  // Inactive until used
      });
      
      // Generate unique 6-digit referral code
      await tempUser.generateReferralCode();
      
      // Save the user to MongoDB
      await tempUser.save();
      
      generatedCodes.push({
        id: tempUser._id,
        code: tempUser.referralCode,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });
    }
    
    res.status(201).json({ referralCodes: generatedCodes });
  } catch (error) {
    console.error('Error generating referral codes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route    DELETE /api/referral-codes/:id
 * @desc     Delete a referral code
 * @access   Admin only
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove referral code
    user.referralCode = null;
    await user.save();
    
    res.json({ message: 'Referral code deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
