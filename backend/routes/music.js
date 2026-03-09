const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const spotifyService = require('../services/spotifyService');
const Mood = require('../models/Mood');

// Get music recommendations based on mood
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    let { mood } = req.query;

    // If no mood provided, get user's latest mood
    if (!mood) {
      const latestMood = await Mood.findOne({ userId: req.userId })
        .sort({ createdAt: -1 })
        .select('mood moodScore');

      if (latestMood) {
        mood = latestMood.mood;
      } else {
        mood = 'neutral';
      }
    }

    const recommendations = await spotifyService.getMusicRecommendations(mood, 0);

    res.json({
      success: true,
      mood,
      playlists: recommendations
    });
  } catch (error) {
    console.error('Music Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to get music recommendations' });
  }
});

// Get recommendations by specific mood
router.get('/recommendations/:mood', verifyToken, async (req, res) => {
  try {
    const { mood } = req.params;

    const validMoods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'anxious', 'stressed', 'calm', 'energetic', 'tired'];
    
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood' });
    }

    const recommendations = await spotifyService.getMusicRecommendations(mood, 0);

    res.json({
      success: true,
      mood,
      playlists: recommendations
    });
  } catch (error) {
    console.error('Music Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to get music recommendations' });
  }
});

module.exports = router;
