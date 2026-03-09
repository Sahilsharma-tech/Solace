const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    enum: ['very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'anxious', 'stressed', 'calm', 'energetic', 'tired'],
    required: true
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  activities: [{
    type: String,
    enum: ['exercise', 'work', 'study', 'social', 'sleep', 'relaxation', 'other']
  }],
  sentimentAnalysis: {
    score: Number,
    magnitude: Number,
    sentiment: String
  },
  triggers: [String],
  interventionTriggered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

moodSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Mood', moodSchema);
