import admin from "firebase-admin";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import { lobbyConverter, playerConverter } from "./model/firebase-converters";

// Initialize Firebase
export const firebaseApp = admin.initializeApp(firebaseConfig);

export const firebaseAuth = firebaseApp.auth();

// Initialize Cloud Firestore and get a reference to the service
export const db = admin.firestore(firebaseApp);

export const lobbiesRef = db.collection("lobbies")
  .withConverter(lobbyConverter);

export function getPlayersRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/players`)
    .withConverter(playerConverter);
}