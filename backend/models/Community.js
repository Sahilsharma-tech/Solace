const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  anonymousName: {
    type: String,
    required: true,
    default: function() {
      const adjectives = ['Brave', 'Strong', 'Peaceful', 'Gentle', 'Kind', 'Calm', 'Wise'];
      const nouns = ['Soul', 'Heart', 'Spirit', 'Mind', 'Friend', 'Warrior', 'Phoenix'];
      return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['anxiety', 'depression', 'stress', 'relationships', 'academic', 'self_care', 'general', 'success_story'],
    default: 'general'
  },
  tags: [String],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    anonymousName: String,
    content: {
      type: String,
      maxlength: 1000
    },
    likes: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ likes: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
