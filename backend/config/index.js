// Application Configuration
// Note: dotenv is loaded in server.js, don't load it here
// In serverless environments, env vars come from the platform
// This file contains application-wide constants and configurations
// Values here can be overridden by environment variables

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      // Modern MongoDB driver doesn't need these options
    }
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // max requests per window
  },

  // User Validation Rules
  user: {
    password: {
      minLength: parseInt(process.env.USER_PASSWORD_MIN_LENGTH) || 6
    },
    age: {
      min: parseInt(process.env.USER_AGE_MIN) || 13,
      max: parseInt(process.env.USER_AGE_MAX) || 30
    },
    displayName: {
      default: process.env.USER_DEFAULT_DISPLAY_NAME || 'Anonymous User'
    }
  },

  // Mood Validation
  mood: {
    score: {
      min: 1,
      max: 10
    }
  },

  // Gamification Configuration
  gamification: {
    defaultPoints: parseInt(process.env.POINTS_DEFAULT) || 5,
    badgeBonus: parseInt(process.env.POINTS_BADGE_BONUS) || 50,
    activities: {
      'breathing_exercise': parseInt(process.env.POINTS_BREATHING) || 10,
      'yoga_session': parseInt(process.env.POINTS_YOGA) || 15,
      'chat_session': parseInt(process.env.POINTS_CHAT_SESSION) || 10,
      'mood_log': parseInt(process.env.POINTS_MOOD_LOG) || 10,
      'community_post': parseInt(process.env.POINTS_COMMUNITY_POST) || 15,
      'community_comment': parseInt(process.env.POINTS_COMMUNITY_COMMENT) || 5,
      'music_listen': parseInt(process.env.POINTS_MUSIC_LISTEN) || 5
    },
    levelThresholds: [0, 100, 250, 500, 1000, 2000, 5000] // Points needed for each level
  },

  // Google Cloud Configuration
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    gemini: {
      model: process.env.GEMINI_MODEL || 'gemini-pro'
    }
  },

  // Spotify Configuration (Legacy - kept for compatibility)
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  },

  // Last.fm Configuration (Legacy)
  lastfm: {
    apiKey: process.env.LASTFM_API_KEY
  },

  // SoundCloud Configuration (Legacy)
  soundcloud: {
    clientId: process.env.SOUNDCLOUD_CLIENT_ID
  },

  // YouTube Data API v3 (Free Music Streaming - Best option!)
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY
  },

  // Feature Flags
  features: {
    useGoogleCloud: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS),
    useSpotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    useLastFM: !!process.env.LASTFM_API_KEY,
    useSoundCloud: !!process.env.SOUNDCLOUD_CLIENT_ID,
    useYouTube: !!process.env.YOUTUBE_API_KEY,
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false'
  }
};
