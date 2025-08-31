const express = require('express');
const { body, validationResult } = require('express-validator');
const Affiliate = require('../models/Affiliate');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/affiliates/apply
// @desc    Apply for affiliate program
// @access  Private
router.post('/apply', [
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('experienceLevel').isIn(['beginner', 'intermediate', 'expert']),
  body('marketingChannels').isArray().withMessage('Marketing channels must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, applicationNotes, experienceLevel, marketingChannels } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.allowAffiliate) {
      return res.status(400).json({ message: 'This product does not allow affiliate marketing' });
    }

    // Check if already applied
    const existingAffiliate = await Affiliate.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingAffiliate) {
      return res.status(400).json({ message: 'Already applied for this product' });
    }

    const affiliate = new Affiliate({
      user: req.user._id,
      product: productId,
      commissionRate: product.commissionRate,
      applicationNotes,
      experienceLevel,
      marketingChannels
    });

    await affiliate.save();
    await affiliate.populate('product', 'name commissionRate');

    res.status(201).json(affiliate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/my-affiliates
// @desc    Get user's affiliate applications
// @access  Private
router.get('/my-affiliates', async (req, res) => {
  try {
    const affiliates = await Affiliate.find({ user: req.user._id })
      .populate('product', 'name images price commissionRate')
      .sort({ createdAt: -1 });

    res.json(affiliates);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/earnings
// @desc    Get affiliate earnings
// @access  Private
router.get('/earnings', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = {
      'affiliate.user': req.user._id,
      status: { $in: ['delivered', 'completed'] }
    };

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const earnings = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$affiliate.commission' },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const result = earnings[0] || {
      totalEarnings: 0,
      totalSales: 0,
      orderCount: 0
    };

    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/admin/applications
// @desc    Get all affiliate applications (Admin only)
// @access  Private/Admin
router.get('/admin/applications', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const affiliates = await Affiliate.find(query)
      .populate('user', 'name email phone')
      .populate('product', 'name price commissionRate')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Affiliate.countDocuments(query);

    res.json({
      affiliates,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/affiliates/admin/:id/approve
// @desc    Approve affiliate application (Admin only)
// @access  Private/Admin
router.put('/admin/:id/approve', requireAdmin, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate application not found' });
    }

    affiliate.status = 'active';
    affiliate.approvedBy = req.user._id;
    affiliate.approvedAt = new Date();
    
    await affiliate.save();
    await affiliate.populate('user product');

    res.json(affiliate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/affiliates/admin/:id/reject
// @desc    Reject affiliate application (Admin only)
// @access  Private/Admin
router.put('/admin/:id/reject', requireAdmin, [
  body('rejectionReason').trim().isLength({ min: 5 }).withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rejectionReason } = req.body;
    
    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate application not found' });
    }

    affiliate.status = 'inactive';
    affiliate.rejectedAt = new Date();
    affiliate.rejectionReason = rejectionReason;
    
    await affiliate.save();
    await affiliate.populate('user product');

    res.json(affiliate);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/admin/stats
// @desc    Get affiliate statistics (Admin only)
// @access  Private/Admin
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await Affiliate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCommissions = await Order.aggregate([
      {
        $match: {
          'affiliate.user': { $exists: true },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$affiliate.commission' },
          totalAffiliateOrders: { $sum: 1 }
        }
      }
    ]);

    const result = {
      statusBreakdown: stats,
      totalCommissions: totalCommissions[0]?.totalCommissions || 0,
      totalAffiliateOrders: totalCommissions[0]?.totalAffiliateOrders || 0
    };

    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/track/:code
// @desc    Track affiliate click
// @access  Public
router.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { productId } = req.query;

    const affiliate = await Affiliate.findOne({ 
      uniqueCode: code,
      product: productId,
      status: 'active'
    });

    if (affiliate) {
      affiliate.totalClicks += 1;
      await affiliate.save();
    }

    // Redirect to product page
    res.redirect(`${process.env.CLIENT_URL}/product/${productId}?ref=${code}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
