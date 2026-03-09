require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./config');

// Import config
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const chatbotRoutes = require('./routes/chatbot');
const moodRoutes = require('./routes/mood');
const musicRoutes = require('./routes/music');
const communityRoutes = require('./routes/community');
const gamificationRoutes = require('./routes/gamification');

const app = express();

// Lazy database connection for serverless - connection is cached
const ensureDBConnection = async () => {
  // Check if mongoose is already connected
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  // If connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve) => {
      mongoose.connection.once('connected', () => resolve(true));
      mongoose.connection.once('error', () => resolve(false));
    });
  }
  
  // Otherwise, connect
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Middleware to ensure DB connection on each request
app.use(async (req, res, next) => {
  const isConnected = await ensureDBConnection();
  if (!isConnected && req.path.startsWith('/api/') && req.path !== '/api/health') {
    return res.status(503).json({ 
      error: 'Database connection unavailable',
      message: 'Please try again in a few moments'
    });
  }
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});

if (config.features.enableRateLimiting) {
  app.use('/api/', limiter);
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health check (doesn't require DB)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'ok', 
    message: 'Solace API is running',
    database: dbStatus[dbState] || 'unknown',
    environment: config.server.env,
    timestamp: new Date().toISOString()
  });
});

// Environment variables check (for debugging Vercel deployment)
app.get('/api/env-check', (req, res) => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'LASTFM_API_KEY',
    'SOUNDCLOUD_CLIENT_ID',
    'YOUTUBE_API_KEY',
    'FRONTEND_URL',
    'NODE_ENV'
  ];
  
  const envStatus = {};
  requiredVars.forEach(varName => {
    envStatus[varName] = {
      isSet: !!process.env[varName],
      length: process.env[varName] ? process.env[varName].length : 0,
      preview: process.env[varName] ? process.env[varName].substring(0, 10) + '...' : 'NOT SET'
    };
  });
  
  res.json({
    message: 'Environment variables check',
    environment: process.env.NODE_ENV || 'not set',
    variables: envStatus,
    allSet: requiredVars.every(v => !!process.env[v])
  });
});

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = config.server.port;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Get local network IP address
const getLocalIP = () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, HOST, () => {
    const localIP = getLocalIP();
    
    console.log(`
═══════════════════════════════════════════
║                                           ║
║       🌟 SOLACE - Mental Wellness 🌟      ║
║                                           ║
║   AI-Powered Support for Youth            ║
║                                           ║
║═══════════════════════════════════════════

✅ Server running on port ${PORT}
✅ Environment: ${config.server.env}

📡 Access URLs:
   Local:    http://localhost:${PORT}
   Network:  http://${localIP}:${PORT}

💡 Share the Network URL with friends on the same WiFi!
  `);
  });
}

module.exports = app;
