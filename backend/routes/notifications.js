const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/notifications/send
// @desc    Send notification to user (Admin only)
// @access  Private/Admin
router.post('/send', requireAdmin, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('type').optional().isIn(['urgent_message', 'system_alert', 'admin_notice']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, message, type = 'urgent_message', priority = 'medium' } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create notification
    const notification = new Notification({
      userId,
      fromAdminId: req.user._id,
      message,
      type,
      priority
    });

    await notification.save();

    res.json({
      message: 'Notification sent successfully',
      notification: {
        id: notification._id,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/user/:userId
// @desc    Get user notifications (Admin only)
// @access  Private/Admin
router.get('/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const notifications = await Notification.find({ userId: req.params.userId })
      .populate('fromAdminId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments({ userId: req.params.userId });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
