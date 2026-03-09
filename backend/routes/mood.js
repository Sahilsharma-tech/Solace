const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Mood = require('../models/Mood');
const User = require('../models/User');
const sentimentService = require('../services/sentimentService');
const geminiService = require('../services/geminiService');
const interventionService = require('../services/interventionService');
const config = require('../config');

router.post('/log', verifyToken, async (req, res) => {
  try {
    const { mood, moodScore, notes, activities, triggers } = req.body;

    if (!mood || !moodScore) {
      return res.status(400).json({ error: 'Mood and mood score required' });
    }

    let sentimentAnalysis = null;
    let intervention = null;
    
    if (notes && notes.trim().length > 0) {
      const sentimentData = await sentimentService.detectStressIndicators(notes);
      sentimentAnalysis = sentimentData.sentimentAnalysis;

      if (sentimentData.shouldTriggerIntervention) {
        intervention = interventionService.triggerIntervention(sentimentData);
      }
    }

    const moodEntry = new Mood({
      userId: req.userId,
      mood,
      moodScore,
      notes,
      activities,
      triggers,
      sentimentAnalysis,
      interventionTriggered: intervention !== null
    });

    await moodEntry.save();

    await updateUserStreak(req.userId);

    const suggestion = await geminiService.getWellnessSuggestion({
      mood,
      moodScore,
      notes,
      activities
    });

    res.json({
      success: true,
      moodEntry,
      intervention,
      suggestion
    });
  } catch (error) {
    console.error('Mood Log Error:', error);
    res.status(500).json({ error: 'Failed to log mood' });
  }
});
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const moodHistory = await Mood.find({
      userId: req.userId,
      createdAt: { $gte: dateLimit }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      moods: moodHistory
    });
  } catch (error) {
    console.error('Mood History Error:', error);
    res.status(500).json({ error: 'Failed to retrieve mood history' });
  }
});
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const moods = await Mood.find({
      userId: req.userId,
      createdAt: { $gte: dateLimit }
    });

    const stats = {
      totalEntries: moods.length,
      averageScore: 0,
      moodDistribution: {},
      commonActivities: {},
      sentimentTrend: []
    };

    if (moods.length > 0) {
      const totalScore = moods.reduce((sum, m) => sum + m.moodScore, 0);
      stats.averageScore = (totalScore / moods.length).toFixed(1);

      moods.forEach(m => {
        stats.moodDistribution[m.mood] = (stats.moodDistribution[m.mood] || 0) + 1;
      });

      moods.forEach(m => {
        if (m.activities) {
          m.activities.forEach(activity => {
            stats.commonActivities[activity] = (stats.commonActivities[activity] || 0) + 1;
          });
        }
      });

      const weeks = Math.ceil(days / 7);
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(dateLimit);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekMoods = moods.filter(m => 
          m.createdAt >= weekStart && m.createdAt < weekEnd
        );

        if (weekMoods.length > 0) {
          const weekAvg = weekMoods.reduce((sum, m) => sum + m.moodScore, 0) / weekMoods.length;
          stats.sentimentTrend.push({
            week: i + 1,
            averageScore: weekAvg.toFixed(1),
            entries: weekMoods.length
          });
        }
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Mood Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve mood statistics' });
  }
});
async function updateUserStreak(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const lastActivity = user.gamification.streak.lastActivity;

    if (!lastActivity) {
      user.gamification.streak.current = 1;
      user.gamification.streak.lastActivity = now;
    } else {
      const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

      if (hoursSinceLastActivity < 24) {
        return;
      } else if (hoursSinceLastActivity < 48) {
        user.gamification.streak.current += 1;
        user.gamification.streak.lastActivity = now;

        if (user.gamification.streak.current > user.gamification.streak.longest) {
          user.gamification.streak.longest = user.gamification.streak.current;
        }
      } else {
        user.gamification.streak.current = 1;
        user.gamification.streak.lastActivity = now;
      }
    }

    user.gamification.points += config.gamification.activities.mood_log;

    await user.save();
  } catch (error) {
    console.error('Streak Update Error:', error);
  }
}

module.exports = router;
