const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

function initializeFirebase() {
  if (initialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }

  if (serviceAccountPath) {
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);
    const fs = require('fs');
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Firebase service account file not found at ${resolvedPath}. ` +
          'Download it from Firebase Console → Project settings → Service accounts → Generate new private key, then save as backend/serviceAccountKey.json'
      );
    }
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  } else {
    admin.initializeApp({ projectId });
  }

  initialized = true;
  return admin;
}

module.exports = { initializeFirebase, getAdmin: () => admin };
