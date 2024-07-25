import admin from 'firebase-admin';
import firebaseConfig from '../firebase-config.json';

// This module overrides firebase to use local emulator.
// Only import this module in integration tests.

// See links for more info:
// https://firebase.google.com/docs/emulator-suite/connect_firestore#admin_sdks
// https://github.com/firebase/firebase-admin-node/issues/776
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

export const testFirebaseApp = admin.initializeApp({
  projectId: firebaseConfig.projectId,
  credential: admin.credential.applicationDefault(),
});
export const testFirebaseAuth = testFirebaseApp.auth();
export const testFirestore = testFirebaseApp.firestore();
jest.mock('../firebase-server', () => ({
  firebaseApp: testFirebaseApp,
  firebaseAuth: testFirebaseAuth,
  firestore: testFirestore,
}));