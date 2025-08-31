const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

// @route   GET /api/reviews
// @desc    Get all reviews (Admin only)
// @access  Private/Admin
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, product, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (product) query.product = product;
    
    const reviews = await Review.find(query)
      .populate('product', 'name')
      .populate('user', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a specific product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ 
      product: req.params.productId, 
      status: 'approved' 
    })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ 
      product: req.params.productId, 
      status: 'approved' 
    });
    
    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/reviews/:id/status
// @desc    Update review status (Admin only)
// @access  Private/Admin
router.put('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    ).populate('product', 'name').populate('user', 'firstName lastName phone');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update product rating if approved
    if (status === 'approved') {
      await updateProductRating(review.product._id);
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);
    
    // Update product rating after deletion
    await updateProductRating(productId);
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ 
      product: productId, 
      status: 'approved' 
    });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        'rating.average': 0,
        'rating.count': 0
      });
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
      'rating.count': reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

module.exports = router;
