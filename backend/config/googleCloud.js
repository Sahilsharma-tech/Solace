const { VertexAI } = require('@google-cloud/vertexai');
const language = require('@google-cloud/language');
const speech = require('@google-cloud/speech');
const config = require('./index');

const initVertexAI = () => {
  const vertexAI = new VertexAI({
    project: config.googleCloud.projectId,
    location: config.googleCloud.location,
  });
  
  return vertexAI;
};

const initLanguageClient = () => {
  const client = new language.LanguageServiceClient();
  return client;
};

const initSpeechClient = () => {
  const client = new speech.SpeechClient();
  return client;
};

module.exports = {
  initVertexAI,
  initLanguageClient,
  initSpeechClient
};
