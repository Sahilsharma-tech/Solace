const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!config.jwt.secret) {
      console.error('❌ JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    
    // Get user from database
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };
