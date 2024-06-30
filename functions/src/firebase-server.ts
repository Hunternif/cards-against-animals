import admin from 'firebase-admin';

// This import is copied during build
import firebaseConfig from './firebase-config.json';
import {
  deckConverter,
  lobbyConverter,
  userConverter,
} from './shared/firestore-converters';
import { database } from 'firebase-functions/v1';

// Initialize Firebase
export const firebaseApp = admin.initializeApp(firebaseConfig);

export const firebaseAuth = firebaseApp.auth();

// Initialize Cloud Firestore and get a reference to the service
export const firestore = admin.firestore(firebaseApp);

/** Region-based RTDB instance for cloud functions */
export const rtdb = new database.InstanceBuilder(firebaseConfig.databaseName, {
  regions: [firebaseConfig.region],
});

export const decksRef = firestore
  .collection('decks')
  .withConverter(deckConverter);
export const lobbiesRef = firestore
  .collection('lobbies')
  .withConverter(lobbyConverter);
export const usersRef = firestore
  .collection('users')
  .withConverter(userConverter);
