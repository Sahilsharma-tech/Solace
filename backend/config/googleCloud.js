const { VertexAI } = require('@google-cloud/vertexai');
const language = require('@google-cloud/language');
const speech = require('@google-cloud/speech');
const config = require('./index');

// Initialize Vertex AI for Gemini
const initVertexAI = () => {
  const vertexAI = new VertexAI({
    project: config.googleCloud.projectId,
    location: config.googleCloud.location,
  });
  
  return vertexAI;
};

// Initialize Natural Language API
const initLanguageClient = () => {
  const client = new language.LanguageServiceClient();
  return client;
};

// Initialize Speech-to-Text API
const initSpeechClient = () => {
  const client = new speech.SpeechClient();
  return client;
};

module.exports = {
  initVertexAI,
  initLanguageClient,
  initSpeechClient
};
