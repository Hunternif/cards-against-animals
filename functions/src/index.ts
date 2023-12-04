/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import cors from "cors";
import admin from 'firebase-admin';
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";

// Initialize Firebase
const firebaseApp = admin.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = admin.firestore(firebaseApp);

// Thanks to https://stackoverflow.com/a/42756623/1093712
const withCors = cors({ origin: true });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// TODO: maybe switch to onCall, it should handle CORS and errors better.

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onRequest(
  { region: firebaseConfig.region },
  async (request, response) => {
    return withCors(request, response, async () => {
      const creatorUID = request.body['data']['creator_uid'];

      // Find current active lobby for this user:
      const foundLobbies = (await db.collection('lobbies')
        .where('status', '==', 'new')
        .where('player_uids', 'array-contains', creatorUID)
        .get()).docs;
      if (foundLobbies.length > 0) {
        const lobbyID = foundLobbies[0].id;
        logger.info(`Found active lobby ${lobbyID} for user ${creatorUID}`);
        response.status(200).send({ data: { lobby_id: lobbyID } });
        return;
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
      response.status(200).send({ data: { lobby_id: newID } });
    });
  });
