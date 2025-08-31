const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Create Socket.IO server
const io = new Server(PORT, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:5175", 
      "http://localhost:5176",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Handle user joining their room
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} joined their room`);
      
      // Notify admin room about user connection
      io.to('admin-room').emit('user-connected', userId);
    }
  });

  // Handle admin joining admin room
  socket.on('join-admin-room', (adminId) => {
    if (adminId) {
      socket.join('admin-room');
      socket.join(`admin-${adminId}`);
      console.log(`Admin ${adminId} joined admin room`);
    }
  });

  // Handle sending messages from admin to users
  socket.on('send-admin-message', (data) => {
    const { recipientId, message, sender } = data;
    
    console.log(`📨 Admin message from ${sender.name} to user ${recipientId}: ${message}`);
    
    // Emit to specific user
    io.to(`user-${recipientId}`).emit('admin-message', {
      _id: data.messageId,
      id: data.messageId,
      content: message,
      sender: {
        name: sender.name || 'Admin',
        role: sender.role
      },
      timestamp: new Date().toISOString()
    });
  });

  // Handle chat messages
  socket.on('send-chat-message', (data) => {
    const { roomId, message, sender } = data;
    
    // Broadcast to all users in the chat room
    io.to(roomId).emit('receive-chat-message', {
      id: Date.now().toString(),
      message,
      sender,
      timestamp: new Date().toISOString()
    });
  });

  // Handle notifications
  socket.on('send-notification', (data) => {
    const { userId, notification } = data;
    
    if (userId === 'all') {
      // Broadcast to all connected users
      io.emit('notification', notification);
    } else {
      // Send to specific user
      io.to(`user-${userId}`).emit('notification', notification);
    }
  });

  // Handle request for online users list
  socket.on('get-online-users', () => {
    const onlineUserIds = Array.from(connectedUsers.keys());
    socket.emit('online-users-list', onlineUserIds);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
    
    // Find and remove from connected users
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        disconnectedUserId = userId;
        break;
      }
    }
    
    // Notify admin room about user disconnection
    if (disconnectedUserId) {
      io.to('admin-room').emit('user-disconnected', disconnectedUserId);
    }
  });
});

console.log(`🚀 Socket.IO server running on port ${PORT}`);
console.log(`📱 Accepting connections from frontend applications`);

// Export io instance for potential external use
module.exports = { io };
