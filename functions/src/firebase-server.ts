import admin from 'firebase-admin';

// This import is copied during build
import { database } from 'firebase-functions/v1';
import firebaseConfig from './firebase-config.json';

// Initialize Firebase
export const firebaseApp = admin.initializeApp(firebaseConfig);

export const firebaseAuth = firebaseApp.auth();

// Initialize Cloud Firestore and get a reference to the service
export const firestore = firebaseApp.firestore();

/** Region-based RTDB instance for cloud functions */
export const rtdb = new database.InstanceBuilder(firebaseConfig.databaseName, {
  regions: [firebaseConfig.region],
});
