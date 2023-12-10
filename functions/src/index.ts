import * as logger from "firebase-functions/logger";
import { onCall } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import { assertLobbyCreator, assertLoggedIn } from "./model/auth-api";
import {
  addPlayer,
  copyDecksToLobby,
  createLobby,
  findActiveLobbyIDWithPlayer,
  getLobby,
  updateLobby
} from "./model/lobby-server-api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    const creatorUID = event.data.creator_uid;
    // Find current active lobby for this user:
    const foundLobbyID = await findActiveLobbyIDWithPlayer(creatorUID);
    if (foundLobbyID) {
      return { lobby_id: foundLobbyID };
    }
    // Create a new lobby:
    const newLobby = await createLobby(creatorUID);
    return { lobby_id: newLobby.id };
  }
);

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobby = onCall<
  { user_id: string, lobby_id: string }, Promise<void>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    await addPlayer(event.data.lobby_id, event.data.user_id);
  }
);

/** Combines `findOrCreateLobby` and `joinLobby` */
export const findOrCreateLobbyAndJoin = onCall<
  { user_id: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    // await sleep(2000);
    assertLoggedIn(event);
    const userID = event.data.user_id;
    const lobbyID = await findActiveLobbyIDWithPlayer(userID) ??
      (await createLobby(userID)).id;
    await addPlayer(lobbyID, userID);
    return { lobby_id: lobbyID };
  }
);

/** Completes lobby setup and starts the game. */
export const startLobby = onCall<
  { lobby_id: string }, Promise<void>
>(
  { region: firebaseConfig.region, maxInstances: 2 },
  async (event) => {
    assertLoggedIn(event);
    const lobby = await getLobby(event.data.lobby_id);
    assertLobbyCreator(event, lobby);
    // Copy cards from all added decks into the lobby:
    await copyDecksToLobby(lobby);
    // Start the game:
    lobby.status = "in_progress";
    await updateLobby(lobby);
    logger.info(`Started lobby ${lobby.id}`);
  }
);