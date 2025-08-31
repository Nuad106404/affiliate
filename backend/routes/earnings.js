const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/earnings/breakdown
// @desc    Get user's earnings breakdown
// @access  Private
router.get('/breakdown', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching earnings for user:', userId);
    
    // Get user data with stored earnings
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found - todayEarnings:', user.todayEarnings, 'weekEarnings:', user.weekEarnings);

    // Get current date and calculate time ranges for monthly earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get monthly earnings from orders (for "This Month" calculation)
    const monthEarnings = await Order.aggregate([
      {
        $match: {
          $or: [
            { customer: new mongoose.Types.ObjectId(userId) },
            { 'affiliate.user': new mongoose.Types.ObjectId(userId) }
          ],
          createdAt: { $gte: startOfMonth },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ['$customer', new mongoose.Types.ObjectId(userId)] },
                0,
                '$affiliate.commission'
              ]
            }
          }
        }
      }
    ]);

    // Use stored values for today and week, calculated value for month
    const todayAmount = user.todayEarnings || 0;
    const weekAmount = user.weekEarnings || 0;
    const monthAmount = user.totalEarned || monthEarnings[0]?.total || 0;

    console.log('Returning earnings - today:', todayAmount, 'week:', weekAmount, 'month:', monthAmount);

    // Calculate percentage changes (placeholder logic)
    const todayChange = '+15.2';
    const weekChange = '+12.5';
    const monthChange = '+8.2';

    const response = {
      today: {
        amount: todayAmount.toFixed(2),
        change: todayChange
      },
      week: {
        amount: weekAmount.toFixed(2),
        change: weekChange
      },
      month: {
        amount: monthAmount.toFixed(2),
        change: monthChange
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('Error fetching earnings breakdown:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
