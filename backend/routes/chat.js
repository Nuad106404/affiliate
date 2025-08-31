const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    let conversations;
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Admin sees all conversations grouped by user
      conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: req.user._id },
              { recipient: req.user._id }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', req.user._id] },
                '$recipient',
                '$sender'
              ]
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$recipient', req.user._id] },
                      { $ne: ['$status', 'read'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              avatar: '$user.avatar'
            },
            lastMessage: '$lastMessage',
            unreadCount: '$unreadCount'
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);
    } else {
      // Client sees conversation with admin
      conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: req.user._id },
              { recipient: req.user._id }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: null,
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$recipient', req.user._id] },
                      { $ne: ['$status', 'read'] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            user: {
              _id: 'admin',
              name: 'Support Team',
              email: 'support@example.com'
            },
            lastMessage: '$lastMessage',
            unreadCount: '$unreadCount'
          }
        }
      ]);
    }

    res.json(conversations);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/messages/:userId
// @desc    Get messages with specific user
// @access  Private
router.get('/messages/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { userId } = req.params;

    let query;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Admin can chat with any user
      query = {
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id }
        ]
      };
    } else {
      // Client can only chat with admin
      const adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
      if (!adminUser) {
        return res.status(404).json({ message: 'No admin available' });
      }
      
      query = {
        $or: [
          { sender: req.user._id, recipient: adminUser._id },
          { sender: adminUser._id, recipient: req.user._id }
        ]
      };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        recipient: req.user._id,
        sender: userId,
        status: { $ne: 'read' }
      },
      {
        $set: { status: 'read', readAt: new Date() }
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/send
// @desc    Send message
// @access  Private
router.post('/send', [
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required'),
  body('recipientId').optional().isMongoId().withMessage('Invalid recipient ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, recipientId, messageType = 'text' } = req.body;
    
    let recipient;
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Admin sending to specific user
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required for admin' });
      }
      recipient = await User.findById(recipientId);
    } else {
      // Client sending to admin
      recipient = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipient._id,
      content,
      messageType
    });

    await message.save();
    await message.populate('sender recipient', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:id/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.markAsRead();
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      status: { $ne: 'read' }
    });

    res.json({ count });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
