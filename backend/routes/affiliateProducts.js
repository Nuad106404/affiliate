const express = require('express');
const AffiliateProduct = require('../models/AffiliateProduct');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/affiliate-products
// @desc    Get user's affiliate products
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const affiliateProducts = await AffiliateProduct.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .populate('productId', 'name description price discountedAmount category images rating stock vendor createdAt')
    .sort({ addedAt: -1 });

    // Calculate total stats
    const totalProducts = affiliateProducts.length;
    const totalEarnings = affiliateProducts.reduce((sum, ap) => sum + ap.totalEarnings, 0);

    res.json({
      products: affiliateProducts,
      stats: {
        totalProducts,
        totalEarnings: totalEarnings.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/affiliate-products
// @desc    Add product to affiliate center
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('POST /affiliate-products - User:', req.user?._id);
    console.log('POST /affiliate-products - Body:', req.body);
    
    const { productId } = req.body;

    if (!productId) {
      console.log('Missing productId in request body');
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    console.log('Checking if product exists:', productId);
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product found:', product.name);

    // Check if already added to affiliate center
    console.log('Checking for existing affiliate product');
    const existingAffiliateProduct = await AffiliateProduct.findOne({
      userId: req.user._id,
      productId
    });

    if (existingAffiliateProduct) {
      console.log('Existing affiliate product found, isActive:', existingAffiliateProduct.isActive);
      if (existingAffiliateProduct.isActive) {
        return res.status(400).json({ message: 'Product already in your affiliate center' });
      } else {
        // Reactivate if previously deactivated
        existingAffiliateProduct.isActive = true;
        await existingAffiliateProduct.save();
        await existingAffiliateProduct.populate('productId', 'name description price discountedAmount category images rating stock vendor createdAt');
        console.log('Reactivated affiliate product');
        return res.json(existingAffiliateProduct);
      }
    }

    // Create new affiliate product
    console.log('Creating new affiliate product');
    const affiliateProduct = new AffiliateProduct({
      userId: req.user._id,
      productId,
      commissionRate: product.commissionRate || 10, // Use product's commission rate or default to 10%
      referralCode: `${req.user._id.toString().slice(-6)}-${productId.slice(-6)}-${Date.now().toString().slice(-6)}`
    });

    await affiliateProduct.save();
    console.log('Affiliate product saved, populating...');
    await affiliateProduct.populate('productId', 'name description price discountedAmount category images rating stock vendor createdAt');
    console.log('Affiliate product created successfully');

    res.status(201).json(affiliateProduct);
  } catch (error) {
    console.error('Error adding affiliate product:', error);
    console.error('Error stack:', error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product already in your affiliate center' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/affiliate-products/:id
// @desc    Remove product from affiliate center
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const affiliateProduct = await AffiliateProduct.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!affiliateProduct) {
      return res.status(404).json({ message: 'Affiliate product not found' });
    }

    // Hard delete from database
    await AffiliateProduct.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product removed from affiliate center' });
  } catch (error) {
    console.error('Error removing affiliate product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliate-products/stats
// @desc    Get affiliate stats
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const affiliateProducts = await AffiliateProduct.find({ 
      userId: req.user._id,
      isActive: true 
    });

    const totalProducts = affiliateProducts.length;
    const totalEarnings = affiliateProducts.reduce((sum, ap) => sum + ap.totalEarnings, 0);
    const totalClicks = affiliateProducts.reduce((sum, ap) => sum + ap.totalClicks, 0);
    const totalSales = affiliateProducts.reduce((sum, ap) => sum + ap.totalSales, 0);

    res.json({
      totalProducts,
      totalEarnings: totalEarnings.toFixed(2),
      totalClicks,
      totalSales
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/affiliate-products/:id/track-click
// @desc    Track click on affiliate link
// @access  Private
router.post('/:id/track-click', authMiddleware, async (req, res) => {
  try {
    const affiliateProduct = await AffiliateProduct.findById(req.params.id);
    
    if (!affiliateProduct) {
      return res.status(404).json({ message: 'Affiliate product not found' });
    }

    affiliateProduct.totalClicks += 1;
    await affiliateProduct.save();

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
