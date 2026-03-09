const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    sentimentAnalysis: {
      score: Number,
      magnitude: Number,
      sentiment: String
    }
  }],
  summary: {
    mainTopics: [String],
    overallSentiment: String,
    interventionsTriggered: [String]
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

// Index for efficient queries
chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
