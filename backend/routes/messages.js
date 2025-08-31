const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const SocketClient = require('../../socket/socketClient');

// Initialize socket client for backend-to-socket communication
const socketClient = new SocketClient(process.env.SOCKET_URL || 'http://localhost:4000');
socketClient.connect();

// Get Socket.IO instance
let io;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

module.exports.setSocketIO = setSocketIO;

// Send a temporary message from admin to client
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Verify sender is admin or superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Verify recipient exists
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create the message
    const newMessage = new Message({
      sender: req.user.id,
      recipient: userId,
      content: message,
      messageType: 'text',
      status: 'sent'
    });

    await newMessage.save();

    // Send real-time message via socket client
    socketClient.sendAdminMessage(
      userId,
      message,
      {
        name: req.user.name || 'Admin',
        role: req.user.role
      },
      newMessage._id
    );

    res.status(200).json({
      message: 'Message sent successfully',
      messageId: newMessage._id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Get messages for a client (and mark them as read/delete them)
router.get('/client/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can access their own messages or is admin
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find unread messages for this user
    const messages = await Message.find({
      recipient: userId,
      status: { $in: ['sent', 'delivered'] }
    })
    .populate('sender', 'name role')
    .sort({ createdAt: -1 });

    // Mark messages as read and delete them immediately
    if (messages.length > 0) {
      const messageIds = messages.map(msg => msg._id);
      await Message.deleteMany({ _id: { $in: messageIds } });
    }

    res.status(200).json({
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender,
        createdAt: msg.createdAt,
        messageType: msg.messageType
      }))
    });

  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Server error while retrieving messages' });
  }
});

// Get message count for a client (without deleting)
router.get('/count/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user can access their own message count or is admin
    if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const count = await Message.countDocuments({
      recipient: userId,
      status: { $in: ['sent', 'delivered'] }
    });

    res.status(200).json({ count });

  } catch (error) {
    console.error('Error getting message count:', error);
    res.status(500).json({ message: 'Server error while getting message count' });
  }
});

// Delete a specific message by ID
router.delete('/delete/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    console.log('Delete request received for message ID:', messageId);
    console.log('User requesting deletion:', req.user.id, 'Role:', req.user.role);

    // Find the message first to verify ownership
    const message = await Message.findById(messageId);
    
    if (!message) {
      console.log('Message not found in database');
      return res.status(404).json({ message: 'Message not found' });
    }

    console.log('Found message - Recipient:', message.recipient.toString(), 'Sender:', message.sender);

    // Verify user can delete their own message or is admin
    if (req.user.id !== message.recipient.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      console.log('Access denied - User cannot delete this message');
      return res.status(403).json({ message: 'Access denied' });
    }

    const deletedMessage = await Message.findByIdAndDelete(messageId);
    console.log('Message deleted successfully:', deletedMessage ? 'Yes' : 'No');

    res.status(200).json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

module.exports = router;
module.exports.setSocketIO = setSocketIO;
