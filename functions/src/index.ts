import { onCall } from "firebase-functions/v2/https";

// This import is copied during build
import firebaseConfig from "./firebase-config.json";
import { addPlayer, createLobby, findActiveLobbyIDWithPlayer } from "./model/lobby-server-api";


/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobby = onCall<
  { creator_uid: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region },
  async (event) => {
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
  { region: firebaseConfig.region },
  async (event) => {
    await addPlayer(event.data.lobby_id, event.data.user_id);
  }
);

/** Combines `findOrCreateLobby` and `joinLobby` */
export const findOrCreateLobbyAndJoin = onCall<
  { user_id: string }, Promise<{ lobby_id: string }>
>(
  { region: firebaseConfig.region },
  async (event) => {
    const userID = event.data.user_id;
    const lobbyID = await findActiveLobbyIDWithPlayer(userID) ??
      (await createLobby(userID)).id;
    await addPlayer(lobbyID, userID);
    return { lobby_id: lobbyID };
  }
);