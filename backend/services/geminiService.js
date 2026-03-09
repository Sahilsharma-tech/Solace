const { initVertexAI } = require('../config/googleCloud');
const config = require('../config');

class GeminiService {
  constructor() {
    this.hasAPIKey = config.features.useGoogleCloud;
    this.vertexAI = this.hasAPIKey ? initVertexAI() : null;
    this.model = config.googleCloud.gemini.model;
    this.systemPrompt = `You are Solace, an empathetic AI mental wellness companion designed specifically for youth. Your purpose is to provide emotional support, guidance, and encouragement to young people dealing with stress, anxiety, academic pressure, and other mental health challenges.

Your communication style:
- Be warm, understanding, and non-judgmental
- Use age-appropriate language (teens to young adults)
- Validate feelings and experiences
- Offer practical coping strategies
- Never diagnose or replace professional help
- Encourage healthy habits and self-care
- Be optimistic but realistic
- When sensing crisis situations, encourage reaching out to trusted adults or crisis helplines

Remember: You're a supportive friend, not a therapist. Always prioritize user safety.`;
  }

  async chat(userMessage, conversationHistory = []) {
    // Fallback response if no API key
    if (!this.hasAPIKey || !this.vertexAI) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      // Build conversation context
      const context = this.systemPrompt + '\n\n';
      
      // Format conversation history
      let historyText = '';
      for (const msg of conversationHistory) {
        historyText += `${msg.role === 'user' ? 'User' : 'Solace'}: ${msg.content}\n`;
      }

      const prompt = context + historyText + `User: ${userMessage}\nSolace:`;

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const response = await generativeModel.generateContent(request);
      const generatedText = response.response.candidates[0].content.parts[0].text;

      return generatedText.trim();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses
    if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
      return "I understand you're feeling stressed. Try taking a few deep breaths - breathe in for 4 counts, hold for 7, and exhale for 8. This can help calm your nervous system. Remember, it's okay to take breaks when you need them. 💙";
    }
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      return "Anxiety can be overwhelming, but you're not alone. Try grounding yourself: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This helps bring you back to the present moment. 🌟";
    }
    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
      return "I hear that you're feeling down. It's completely valid to feel this way. Sometimes small things help - listening to your favorite song, going for a short walk, or talking to someone you trust. Your feelings matter. 🌈";
    }
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      return "Sleep is so important for mental health. Try establishing a bedtime routine: dim the lights an hour before bed, avoid screens, and maybe try some gentle stretches. Your body and mind need rest to recharge. 😴";
    }
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're very welcome! I'm here whenever you need support. Remember, taking care of your mental health is a sign of strength. 💚";
    }
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm Solace, your mental wellness companion. I'm here to listen and support you. How are you feeling today? Feel free to share what's on your mind. 🌻";
    }
    
    // Default supportive response
    return "Thank you for sharing that with me. I'm here to support you. While I'm currently running in offline mode, I want you to know that your feelings are valid. Remember: it's okay to not be okay sometimes. Have you tried our breathing exercises or mood tracker? They might help. If you're in crisis, please reach out to a trusted adult or call a helpline. 💙";
  }

  async getWellnessSuggestion(moodData) {
    // Fallback if no API key
    if (!this.hasAPIKey || !this.vertexAI) {
      return this.getFallbackSuggestion(moodData.mood);
    }

    try {
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: this.model,
      });

      const prompt = `Based on the following mood data, provide a brief, encouraging wellness suggestion (2-3 sentences):
      
Mood: ${moodData.mood}
Mood Score: ${moodData.moodScore}/10
Notes: ${moodData.notes || 'None'}
Recent Activities: ${moodData.activities?.join(', ') || 'None'}

Provide a personalized, actionable suggestion to help improve their wellbeing.`;

      const response = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      return response.response.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Gemini Suggestion Error:', error);
      return this.getFallbackSuggestion(moodData.mood);
    }
  }

  getFallbackSuggestion(mood) {
    const suggestions = {
      'very_sad': 'Be gentle with yourself today. Small acts of self-care matter. 🌸',
      'sad': 'It\'s okay to feel down. Try doing something small that usually brings you joy. 🌈',
      'anxious': 'Take a moment to breathe deeply. You\'ve got this, one step at a time. 🌟',
      'stressed': 'Remember to take breaks. Your mental health is just as important as your tasks. 💚',
      'neutral': 'You\'re doing great! Keep maintaining balance in your day. ⚖️',
      'calm': 'Beautiful! This peaceful feeling is worth savoring. Keep it going. 🧘',
      'happy': 'Wonderful! Enjoy this positive energy and spread it around. ✨',
      'very_happy': 'Amazing! Your joy is contagious. Celebrate this moment! 🎉',
      'energetic': 'Great energy! Channel it into something you love. 🚀',
      'tired': 'Rest is productive too. Listen to what your body needs. 😴'
    };
    
    return suggestions[mood] || 'Remember to take care of yourself today. Small steps lead to big changes! 💙';
  }
}

module.exports = new GeminiService();
