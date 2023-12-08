import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import { lobbyConverter, playerConverter } from "./model/firebase-converters";
import { GameLobby, PlayerInLobby } from "./shared/types";

// Initialize Firebase
const firebaseApp = admin.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = admin.firestore(firebaseApp);
const lobbiesRef = db.collection("lobbies").withConverter(lobbyConverter);


/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region },
  async (event) => {
    const creatorUID = event.data.creator_uid;

    // Find current active lobby for this user:
    const foundLobbies = (await lobbiesRef
      .where("status", "==", "new")
      .where("player_uids", "array-contains", creatorUID)
      .get()).docs;
    if (foundLobbies.length > 0) {
      const lobbyID = foundLobbies[0].id;
      logger.info(`Found active lobby ${lobbyID} for user ${creatorUID}`);
      return { lobby_id: lobbyID };
    }

    // Create a new lobby:
    // TODO: need to acquire lock. This doesn"t prevent double lobby creation!
    const newLobbyRef = lobbiesRef.doc();
    const newID = newLobbyRef.id;
    const newLobby = new GameLobby(newID, newID, creatorUID, "new");
    newLobby.player_uids.push(creatorUID);
    await newLobbyRef.set(newLobby);
    logger.info(`Created new lobby from user: ${creatorUID}`);
    return { lobby_id: newID };
  }
);

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobby = onCall<
  { user_id: string, lobby_id: string }, Promise<void>
>(
  { region: firebaseConfig.region },
  async (event) => {
    const userID = event.data.user_id;
    const lobbyID = event.data.lobby_id;

    const userName = (await firebaseApp.auth().getUser(userID)).displayName;
    if (!userName) {
      throw new HttpsError("not-found", `User name not found: ${userID}`);
    }
    const lobby = (await lobbiesRef.doc(lobbyID).get()).data();
    if (!lobby) {
      throw new HttpsError("not-found", `Lobby not found: ${lobbyID}`);
    }
    const playersRef = db.collection(`lobbies/${lobbyID}/players`)
      .withConverter(playerConverter);
    const playerRef = playersRef.doc(userID);
    const hasAlreadyJoined = (await playerRef.get()).exists;
    if (hasAlreadyJoined) {
      logger.warn(`User ${userName} (${userID}) tried to join lobby ${lobbyID} twice`);
      return;
    }
    if (lobby.status == "ended") {
      throw new HttpsError("unavailable", `Lobby already ended: ${lobbyID}`);
    }
    const role = (lobby.status == "new") ? "player" : "spectator";
    await playerRef.set(new PlayerInLobby(userID, userName, role));
    logger.info(`User ${userName} (${userID}) joined lobby ${lobbyID} as ${role}`);
  }
);
