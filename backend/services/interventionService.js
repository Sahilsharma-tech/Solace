class InterventionService {
  constructor() {
    this.interventionTypes = {
      breathing: {
        name: 'Breathing Exercise',
        description: 'Take a moment to focus on your breath',
        exercises: [
          {
            name: '4-7-8 Breathing',
            steps: ['Breathe in for 4 seconds', 'Hold for 7 seconds', 'Exhale for 8 seconds', 'Repeat 4 times']
          },
          {
            name: 'Box Breathing',
            steps: ['Breathe in for 4 seconds', 'Hold for 4 seconds', 'Exhale for 4 seconds', 'Hold for 4 seconds', 'Repeat 4 times']
          },
          {
            name: 'Deep Belly Breathing',
            steps: ['Place hand on belly', 'Breathe deeply into your belly for 5 seconds', 'Feel your hand rise', 'Exhale slowly for 5 seconds', 'Repeat 5 times']
          }
        ]
      },
      mindfulness: {
        name: 'Mindfulness Prompt',
        description: 'Ground yourself in the present moment',
        prompts: [
          'Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.',
          'Close your eyes and pay attention to the sounds around you for 60 seconds. What do you notice?',
          'Take three deep breaths. Notice how your body feels with each inhale and exhale.',
          'Look around and find 5 things that are your favorite color. Really focus on each one.',
          'Notice three things you\'re grateful for right now, no matter how small.'
        ]
      },
      break: {
        name: 'Take a Break',
        description: 'Step away and recharge',
        suggestions: [
          'Stand up and stretch for 2 minutes',
          'Take a 5-minute walk outside or around your space',
          'Drink a glass of water slowly and mindfully',
          'Look at something green or natural for 2 minutes',
          'Do 10 gentle jumping jacks or stretches',
          'Listen to your favorite calming song',
          'Step outside and feel the air on your face'
        ]
      },
      affirmation: {
        name: 'Positive Affirmation',
        description: 'Remind yourself of your strength',
        affirmations: [
          'I am stronger than I think, and I can handle this.',
          'This feeling is temporary, and I will get through it.',
          'I deserve kindness, especially from myself.',
          'I am doing my best, and that is enough.',
          'I have overcome challenges before, and I can do it again.',
          'I am worthy of peace and happiness.',
          'It\'s okay to not be okay. I\'m taking steps to feel better.',
          'I am brave for facing my feelings.',
          'I choose to be gentle with myself today.'
        ]
      }
    };
  }

  getIntervention(type) {
    const intervention = this.interventionTypes[type];
    if (!intervention) {
      return this.getRandomIntervention();
    }

    const result = {
      type,
      name: intervention.name,
      description: intervention.description
    };

    // Get random content based on type
    if (intervention.exercises) {
      result.content = intervention.exercises[Math.floor(Math.random() * intervention.exercises.length)];
    } else if (intervention.prompts) {
      result.content = intervention.prompts[Math.floor(Math.random() * intervention.prompts.length)];
    } else if (intervention.suggestions) {
      result.content = intervention.suggestions[Math.floor(Math.random() * intervention.suggestions.length)];
    } else if (intervention.affirmations) {
      result.content = intervention.affirmations[Math.floor(Math.random() * intervention.affirmations.length)];
    }

    return result;
  }

  getRandomIntervention() {
    const types = Object.keys(this.interventionTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return this.getIntervention(randomType);
  }

  getAllInterventions() {
    return Object.keys(this.interventionTypes).map(type => this.getIntervention(type));
  }

  triggerIntervention(sentimentData) {
    // Determine which intervention to trigger based on sentiment
    let interventionType;

    if (sentimentData.detectedKeywords.some(kw => ['anxious', 'anxiety', 'panic', 'nervous'].includes(kw))) {
      interventionType = 'breathing';
    } else if (sentimentData.detectedKeywords.some(kw => ['overwhelmed', 'stressed', 'pressure'].includes(kw))) {
      interventionType = 'break';
    } else if (sentimentData.detectedKeywords.some(kw => ['sad', 'depressed', 'hopeless'].includes(kw))) {
      interventionType = 'affirmation';
    } else {
      interventionType = 'mindfulness';
    }

    return this.getIntervention(interventionType);
  }
}

module.exports = new InterventionService();
