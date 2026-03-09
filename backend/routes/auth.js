const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const config = require('../config');

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName, age } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < config.user.password.minLength) {
      return res.status(400).json({ error: `Password must be at least ${config.user.password.minLength} characters` });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      displayName: displayName || config.user.displayName.default,
      age
    });
    await user.save();

    // Validate JWT_SECRET
    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        gamification: user.gamification
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Validate JWT_SECRET
    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        gamification: user.gamification
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        age: req.user.age,
        gamification: req.user.gamification,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router;
