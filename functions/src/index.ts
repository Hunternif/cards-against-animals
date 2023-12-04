/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";
import admin from 'firebase-admin';

// Thanks to https://stackoverflow.com/a/42756623/1093712
const withCors = cors();

import firebaseConfig from "../../firebase-config.json";
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase
const firebaseApp = admin.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = admin.firestore(firebaseApp);

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const createLobby = onRequest(
  { region: firebaseConfig.region },
  async (request, response) => {
    const creatorUID = request.body['data']['creator_uid'];

    // Confirm there are no active lobbies for this user:
    const activeCount = (await db.collection('lobbies')
    .where('status', '==', 'new')
    .where('player_uids', 'array-contains', creatorUID)
    .count().get()).data().count;
    if (activeCount > 0) {
      logger.warn(`User ${creatorUID} tried to create > 1 lobby`);
      // Firebase ignores the message :/
      response.status(409).end("User tried to create > 1 lobby");
      return;
    }
    
    // Create a new lobby:
    // TODO: need to acquire lock. This doesn't prevent double lobby creation!
    const newLobbyRef = db.collection('lobbies').doc();
    const newID = newLobbyRef.id;
    await newLobbyRef.set({
      id: newID,
      lobby_key: newID,
      creator_uid: newID,
      status: "new",
      time_created: FieldValue.serverTimestamp(),
      player_uids: [creatorUID],
    });
    withCors(request, response, () => {
      logger.info(`Created new lobby from user: ${creatorUID}`);
      response.status(200).send({ data: { lobby_id: newID } });
    });
  });
