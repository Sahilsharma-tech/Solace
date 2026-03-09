const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(`../../${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
};

const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};

module.exports = { initializeFirebase, verifyFirebaseToken };
