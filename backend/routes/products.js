const express = require('express');
const Product = require('../models/Product');
const AffiliateProduct = require('../models/AffiliateProduct');
const { authMiddleware } = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const auditLogger = require('../middleware/auditLogger');
const { uploadProductImages } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortObj)
      .populate('vendor', 'name email');

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    await product.incrementViews();

    res.json(product);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create product (Admin only)
// @access  Private/Admin
router.post('/', authMiddleware, requireAdmin, uploadProductImages, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      vendor: {
        name: req.body.vendorName,
        _id: req.user._id
      }
    };
    
    // Convert numeric fields
    if (productData.price) productData.price = Number(productData.price);
    if (productData.discountedAmount) productData.discountedAmount = Number(productData.discountedAmount);
    if (productData.stock) productData.stock = Number(productData.stock);
    if (productData.commissionRate) productData.commissionRate = Number(productData.commissionRate);
    if (productData.views) productData.views = Number(productData.views);
    
    // Handle rating fields
    if (productData.ratingAverage || productData.ratingCount) {
      productData.rating = {
        average: productData.ratingAverage ? Number(productData.ratingAverage) : 0,
        count: productData.ratingCount ? Number(productData.ratingCount) : 0
      };
      delete productData.ratingAverage;
      delete productData.ratingCount;
    }
    
    // Parse tags if provided
    if (req.body.tags) {
      try {
        productData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        productData.tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${productData.name} image ${index + 1}`,
        isPrimary: index === 0
      }));
    }
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', authMiddleware, requireAdmin, uploadProductImages, async (req, res) => {
  try {
    console.log('PUT request body:', req.body);
    console.log('PUT request files:', req.files);
    
    const updateData = {
      ...req.body
    };
    
    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.discountedAmount) updateData.discountedAmount = Number(updateData.discountedAmount);
    if (updateData.stock) updateData.stock = Number(updateData.stock);
    if (updateData.commissionRate) updateData.commissionRate = Number(updateData.commissionRate);
    if (updateData.views) updateData.views = Number(updateData.views);
    
    // Handle rating fields
    if (updateData.ratingAverage || updateData.ratingCount) {
      updateData.rating = {
        average: updateData.ratingAverage ? Number(updateData.ratingAverage) : 0,
        count: updateData.ratingCount ? Number(updateData.ratingCount) : 0
      };
      delete updateData.ratingAverage;
      delete updateData.ratingCount;
    }
    
    // Update vendor info if provided
    if (req.body.vendorName) {
      updateData.vendor = {
        name: req.body.vendorName,
        _id: req.user._id
      };
    }
    
    // Parse tags if provided
    if (req.body.tags) {
      try {
        updateData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        updateData.tags = req.body.tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${updateData.name} image ${index + 1}`,
        isPrimary: index === 0
      }));
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('PUT product error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete product images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        if (image.url && image.url.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, '..', image.url);
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error deleting image file:', err);
            } else {
              console.log('Deleted image file:', imagePath);
            }
          });
        }
      });
    }

    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);

    // Delete all affiliate products that reference this product
    await AffiliateProduct.deleteMany({ productId: req.params.id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/:id/like
// @desc    Like/Unlike product
// @access  Private
router.post('/:id/like', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.likes += 1;
    await product.save();

    res.json({ likes: product.likes });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get product categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
