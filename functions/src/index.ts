import admin from 'firebase-admin';
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onCall } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";

// Initialize Firebase
const firebaseApp = admin.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = admin.firestore(firebaseApp);


/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region },
  async (event) => {
    const creatorUID = event.data.creator_uid;

    // Find current active lobby for this user:
    const foundLobbies = (await db.collection('lobbies')
      .where('status', '==', 'new')
      .where('player_uids', 'array-contains', creatorUID)
      .get()).docs;
    if (foundLobbies.length > 0) {
      const lobbyID = foundLobbies[0].id;
      logger.info(`Found active lobby ${lobbyID} for user ${creatorUID}`);
      return { lobby_id: lobbyID };
    }

    // Create a new lobby:
    // TODO: need to acquire lock. This doesn't prevent double lobby creation!
    const newLobbyRef = db.collection('lobbies').doc();
    const newID = newLobbyRef.id;
    await newLobbyRef.set({
      id: newID,
      lobby_key: newID,
      creator_uid: creatorUID,
      status: "new",
      time_created: FieldValue.serverTimestamp(),
      player_uids: [creatorUID],
    });
    logger.info(`Created new lobby from user: ${creatorUID}`);
    return { lobby_id: newID };
  }
);
