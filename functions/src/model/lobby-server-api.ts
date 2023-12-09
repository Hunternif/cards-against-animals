import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { firebaseAuth, getPlayersRef, lobbiesRef } from "../firebase-server";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { getUserName } from "./auth-api";

/**
 * Find current active lobby for this user.
 * Return lobby ID.
 */
export async function findActiveLobbyIDWithPlayer(userID: string)
  : Promise<string | null> {
  const foundLobbies = (await lobbiesRef
    .where("status", "==", "new")
    .where("player_uids", "array-contains", userID)
    .get()).docs;
  if (foundLobbies.length > 0) {
    logger.info(`Found active lobby ${foundLobbies[0].id} for user ${userID}`);
    return foundLobbies[0].id;
  } else {
    return null;
  }
}

/** Creates new lobby from his player, returns it. */
export async function createLobby(userID: string): Promise<GameLobby> {
  // TODO: need to acquire lock. This doesn't prevent double lobby creation!
  const newLobbyRef = lobbiesRef.doc();
  const newID = newLobbyRef.id;
  const newLobby = new GameLobby(newID, newID, userID, "new");
  newLobby.player_uids.add(userID);
  await newLobbyRef.set(newLobby);
  logger.info(`Created new lobby from user: ${userID}`);
  return newLobby;
}

/** Finds lobby by ID */
export async function getLobby(lobbyID: string): Promise<GameLobby | null> {
  return (await lobbiesRef.doc(lobbyID).get()).data() ?? null;
}

/**
 * Attempts to add player to lobby as "player",
 * or as "specator if it's in progress.
 */
export async function addPlayer(lobbyID: string, userID: string): Promise<void> {
  const userName = await getUserName(userID);
  const lobby = await getLobby(lobbyID);
  if (!lobby) {
    throw new HttpsError("not-found", `Lobby not found: ${lobbyID}`);
  }
  const playersRef = getPlayersRef(lobbyID);
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
  const player = new PlayerInLobby(userID, userName, role);
  await playerRef.set(player);
  lobby.player_uids.add(userID);
  await lobbiesRef.doc(lobbyID).set(lobby);
  logger.info(`User ${userName} (${userID}) joined lobby ${lobbyID} as ${role}`);
}