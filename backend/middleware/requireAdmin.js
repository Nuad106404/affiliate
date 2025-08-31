const requireAdmin = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has admin or superadmin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }


    next();
  } catch (error) {
    console.error('RequireAdmin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = requireAdmin;
