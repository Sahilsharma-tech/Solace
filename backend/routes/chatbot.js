const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ChatHistory = require('../models/ChatHistory');
const geminiService = require('../services/geminiService');
const sentimentService = require('../services/sentimentService');
const interventionService = require('../services/interventionService');
const { v4: uuidv4 } = require('uuid');

// Create new chat session
router.post('/session', verifyToken, async (req, res) => {
  try {
    const sessionId = uuidv4();
    
    const chatHistory = new ChatHistory({
      userId: req.userId,
      sessionId,
      messages: []
    });
    
    await chatHistory.save();
    
    res.json({
      success: true,
      sessionId,
      message: 'Chat session created'
    });
  } catch (error) {
    console.error('Session Creation Error:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Send message to chatbot
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and session ID required' });
    }

    // Get chat history
    let chatHistory = await ChatHistory.findOne({ 
      userId: req.userId, 
      sessionId 
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId: req.userId,
        sessionId,
        messages: []
      });
    }

    // Analyze sentiment of user message
    const sentimentData = await sentimentService.detectStressIndicators(message);

    // Get AI response
    const conversationHistory = chatHistory.messages.slice(-10); // Last 10 messages
    const aiResponse = await geminiService.chat(message, conversationHistory);

    // Add messages to history
    chatHistory.messages.push({
      role: 'user',
      content: message,
      sentimentAnalysis: sentimentData.sentimentAnalysis
    });

    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    chatHistory.updatedAt = new Date();
    await chatHistory.save();

    // Check if intervention should be triggered
    let intervention = null;
    if (sentimentData.shouldTriggerIntervention) {
      intervention = interventionService.triggerIntervention(sentimentData);
    }

    res.json({
      success: true,
      response: aiResponse,
      sentiment: sentimentData.sentimentAnalysis,
      intervention
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chat history
router.get('/history/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatHistory = await ChatHistory.findOne({
      userId: req.userId,
      sessionId
    });

    if (!chatHistory) {
      return res.status(404).json({ error: 'Chat history not found' });
    }

    res.json({
      success: true,
      messages: chatHistory.messages
    });
  } catch (error) {
    console.error('History Error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// Get all sessions for user
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.userId })
      .select('sessionId createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(20);

    const sessionList = sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      lastMessage: session.messages[session.messages.length - 1]?.content.substring(0, 100)
    }));

    res.json({
      success: true,
      sessions: sessionList
    });
  } catch (error) {
    console.error('Sessions Error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

module.exports = router;
