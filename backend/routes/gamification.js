const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const config = require('../config');

// Get user gamification stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('gamification');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      gamification: user.gamification
    });
  } catch (error) {
    console.error('Gamification Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve gamification stats' });
  }
});

// Award badge
router.post('/badge', verifyToken, async (req, res) => {
  try {
    const { badgeName } = req.body;

    const badges = {
      'first_chat': { name: 'First Chat', description: 'Started your wellness journey', icon: '💬' },
      'mood_tracker': { name: 'Mood Tracker', description: 'Logged your first mood', icon: '😊' },
      'week_streak': { name: 'Week Warrior', description: '7-day activity streak', icon: '🔥' },
      'community_member': { name: 'Community Member', description: 'Made your first community post', icon: '👥' },
      'mindful_master': { name: 'Mindful Master', description: 'Completed 10 breathing exercises', icon: '🧘' },
      'music_lover': { name: 'Music Lover', description: 'Explored 5 music playlists', icon: '🎵' },
      'hundred_points': { name: 'Century Club', description: 'Earned 100 points', icon: '💯' },
      'consistent': { name: 'Consistent', description: '30-day activity streak', icon: '⭐' }
    };

    const badge = badges[badgeName];
    if (!badge) {
      return res.status(400).json({ error: 'Invalid badge' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if badge already earned
    const hasBadge = user.gamification.badges.some(b => b.name === badge.name);
    if (hasBadge) {
      return res.json({ success: true, message: 'Badge already earned' });
    }

    // Award badge
    user.gamification.badges.push({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earnedAt: new Date()
    });

    // Award bonus points
    user.gamification.points += config.gamification.badgeBonus;

    await user.save();

    res.json({
      success: true,
      badge,
      message: `Congratulations! You earned the ${badge.name} badge!`
    });
  } catch (error) {
    console.error('Badge Award Error:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Get leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('displayName gamification.points gamification.level gamification.badges')
      .sort({ 'gamification.points': -1 })
      .limit(10);

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      displayName: user.displayName,
      points: user.gamification.points,
      level: user.gamification.level,
      badgeCount: user.gamification.badges.length
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

// Complete activity (awards points)
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const { activityType, points } = req.body;

    const activityPoints = config.gamification.activities;

    const pointsToAward = points || activityPoints[activityType] || config.gamification.defaultPoints;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.gamification.points += pointsToAward;

    // Level up logic (100 points per level)
    const newLevel = Math.floor(user.gamification.points / 100) + 1;
    const leveledUp = newLevel > user.gamification.level;
    user.gamification.level = newLevel;

    await user.save();

    res.json({
      success: true,
      pointsAwarded: pointsToAward,
      totalPoints: user.gamification.points,
      level: user.gamification.level,
      leveledUp
    });
  } catch (error) {
    console.error('Activity Error:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

module.exports = router;
