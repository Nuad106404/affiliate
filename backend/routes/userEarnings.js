const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/user-earnings/:userId
// @desc    Update user's daily and weekly earnings (Admin only)
// @access  Private/Admin
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { todayEarnings, weekEarnings } = req.body;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate earnings values
    if (todayEarnings !== undefined && (isNaN(todayEarnings) || todayEarnings < 0)) {
      return res.status(400).json({ message: 'Invalid today earnings value' });
    }
    if (weekEarnings !== undefined && (isNaN(weekEarnings) || weekEarnings < 0)) {
      return res.status(400).json({ message: 'Invalid week earnings value' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update earnings directly in User model
    const updateData = {};
    if (todayEarnings !== undefined) {
      updateData.todayEarnings = todayEarnings;
    }
    if (weekEarnings !== undefined) {
      updateData.weekEarnings = weekEarnings;
    }

    // Update user with new earnings
    await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({ 
      message: 'User earnings updated successfully',
      todayEarnings: todayEarnings || user.todayEarnings || 0,
      weekEarnings: weekEarnings || user.weekEarnings || 0
    });

  } catch (error) {
    console.error('Error updating user earnings:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      details: error.stack
    });
  }
});

module.exports = router;
