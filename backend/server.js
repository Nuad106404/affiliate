const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173", process.env.ADMIN_URL || "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const affiliateProductsRoutes = require('./routes/affiliateProducts');
const chatRoutes = require('./routes/chat');
const orderRoutes = require('./routes/orders');
const earningsRoutes = require('./routes/earnings');
const reviewRoutes = require('./routes/reviews');
const referralCodeRoutes = require('./routes/referralCodes');
const affiliateRoutes = require('./routes/affiliates');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const { setSocketIO } = require('./routes/messages');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import and start audit log retention job
const AuditLogRetentionJob = require('./jobs/auditLogRetention');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting - more permissive for admin operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased limit for admin operations
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Separate rate limiter for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // higher limit for admin operations
  message: 'Too many admin requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:5173", process.env.ADMIN_URL || "http://localhost:5174"],
  credentials: true
}));

// Trust proxy for real IP addresses - more specific configuration
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Create default superadmin if it doesn't exist
  const createDefaultSuperAdmin = require('./seeders/defaultSuperAdmin');
  await createDefaultSuperAdmin();
  
  // Audit log retention job disabled - logs will be kept permanently
  // AuditLogRetentionJob.start();
  console.log('📋 Audit logs will be kept permanently - no automatic deletion');
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// Set Socket.IO instance for message routes
setSocketIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join user to their room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join admin to admin room
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('Admin joined admin room');
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    const { recipientId, message, senderId, senderRole } = data;
    
    if (senderRole === 'admin' || senderRole === 'superadmin') {
      // Admin sending to user
      io.to(`user-${recipientId}`).emit('new-message', {
        id: Date.now().toString(),
        text: message,
        sender: 'Admin',
        senderId,
        timestamp: new Date().toISOString(),
        isOwn: false
      });
    } else {
      // User sending to admin
      io.to('admin-room').emit('new-message', {
        id: Date.now().toString(),
        text: message,
        sender: 'User',
        senderId,
        timestamp: new Date().toISOString(),
        isOwn: false,
        userId: senderId
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, adminLimiter, userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/affiliates', authMiddleware, affiliateRoutes);
app.use('/api/admin', authMiddleware, adminLimiter, adminRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/affiliate-products', authMiddleware, affiliateProductsRoutes);
// Add public validation endpoint before protected routes
app.get('/api/referral-codes/validate', async (req, res) => {
  try {
    const { code: referralCode } = req.query;
    
    if (!referralCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Referral code is required' 
      });
    }
    
    // Find user with this referral code
    const User = require('./models/User');
    const referringCodeHolder = await User.findOne({ referralCode });
    
    if (!referringCodeHolder) {
      return res.status(200).json({ 
        success: false,
        message: 'Invalid referral code. Please check and try again.'
      });
    }
    
    // Success - the code is valid
    res.json({ 
      success: true, 
      message: 'Valid referral code', 
      bonusCredits: 50
    });
    
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during validation'
    });
  }
});

app.use('/api/referral-codes', authMiddleware, referralCodeRoutes);
app.use('/api/earnings', authMiddleware, earningsRoutes);
app.use('/api/user-earnings', authMiddleware, require('./routes/userEarnings'));
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/audit-logs', authMiddleware, adminLimiter, require('./routes/auditLogs'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Admin Panel: ${process.env.ADMIN_URL}`);
  console.log(`🛍️  Client Portal: ${process.env.CLIENT_URL}`);
});

module.exports = { app, io };
