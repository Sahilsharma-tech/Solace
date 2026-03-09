const { initLanguageClient } = require('../config/googleCloud');
const config = require('../config');

class SentimentService {
  constructor() {
    this.hasAPIKey = config.features.useGoogleCloud;
    this.client = this.hasAPIKey ? initLanguageClient() : null;
  }

  async analyzeSentiment(text) {
    try {
      if (!text || text.trim().length === 0) {
        return {
          score: 0,
          magnitude: 0,
          sentiment: 'neutral'
        };
      }

      if (!this.hasAPIKey || !this.client) {
        return this.getBasicSentiment(text);
      }

      const document = {
        content: text,
        type: 'PLAIN_TEXT',
      };

      const [result] = await this.client.analyzeSentiment({ document });
      const sentiment = result.documentSentiment;

      let sentimentLabel;
      if (sentiment.score >= 0.25) {
        sentimentLabel = 'positive';
      } else if (sentiment.score <= -0.25) {
        sentimentLabel = 'negative';
      } else {
        sentimentLabel = 'neutral';
      }

      return {
        score: sentiment.score,
        magnitude: sentiment.magnitude,
        sentiment: sentimentLabel
      };
    } catch (error) {
      console.error('Sentiment Analysis Error:', error);
      return this.getBasicSentiment(text);
    }
  }

  getBasicSentiment(text) {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['happy', 'great', 'amazing', 'wonderful', 'good', 'excellent', 'love', 'joy', 'excited', 'better', 'calm', 'peaceful', 'grateful', 'thankful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'anxious', 'stressed', 'worried', 'depressed', 'tired', 'exhausted', 'scared', 'afraid', 'hopeless'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    let score = 0;
    let sentiment = 'neutral';
    
    if (positiveCount > negativeCount) {
      score = 0.5;
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      score = -0.5;
      sentiment = 'negative';
    }
    
    return {
      score,
      magnitude: (positiveCount + negativeCount) * 0.3,
      sentiment
    };
  }

  async detectStressIndicators(text) {
    try {
      const stressKeywords = [
        'stress', 'stressed', 'anxious', 'anxiety', 'worried', 'panic',
        'overwhelmed', 'pressure', 'exhausted', 'tired', 'depressed',
        'sad', 'hopeless', 'helpless', 'scared', 'afraid', 'nervous'
      ];

      const lowerText = text.toLowerCase();
      const detectedKeywords = stressKeywords.filter(keyword => 
        lowerText.includes(keyword)
      );

      const sentiment = await this.analyzeSentiment(text);
      
      const shouldTriggerIntervention = 
        (sentiment.score <= -0.3 && sentiment.magnitude >= 0.5) ||
        detectedKeywords.length >= 2;

      return {
        shouldTriggerIntervention,
        detectedKeywords,
        sentimentAnalysis: sentiment
      };
    } catch (error) {
      console.error('Stress Detection Error:', error);
      return {
        shouldTriggerIntervention: false,
        detectedKeywords: [],
        sentimentAnalysis: { score: 0, magnitude: 0, sentiment: 'neutral' }
      };
    }
  }
}

module.exports = new SentimentService();
