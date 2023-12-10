import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { getPlayersRef, lobbiesRef } from "../firebase-server";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { getUserName } from "./auth-api";
import { getCAAUser, setUsersCurrentLobby } from "./user-server-api";

/**
 * Find current active lobby for this user.
 * Return lobby ID.
 */
export async function findActiveLobbyIDWithPlayer(userID: string)
  : Promise<string | null> {
  // Current lobby is written in the 'users' collection:
  const caaUser = await getCAAUser(userID);
  if (!caaUser) return null;
  return caaUser.current_lobby_id ?? null;
}

/** Creates new lobby from his player, returns it. */
export async function createLobby(userID: string): Promise<GameLobby> {
  // TODO: need to acquire lock. This doesn't prevent double lobby creation!
  const newLobbyRef = lobbiesRef.doc();
  const newID = newLobbyRef.id;
  const newLobby = new GameLobby(newID, newID, userID, "new");
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
  const playersRef = getPlayersRef(lobbyID);
  const playerRef = playersRef.doc(userID);
  const hasAlreadyJoined = (await playerRef.get()).exists;
  if (hasAlreadyJoined) {
    logger.warn(`User ${userName} (${userID}) re-joined lobby ${lobbyID}`);
    return;
  }
  const lobby = await getLobby(lobbyID);
  if (!lobby) {
    throw new HttpsError("not-found", `Lobby not found: ${lobbyID}`);
  }
  if (lobby.status == "ended") {
    throw new HttpsError("unavailable", `Lobby already ended: ${lobbyID}`);
  }
  const role = (lobby.status == "new") ? "player" : "spectator";
  const player = new PlayerInLobby(userID, userName, role);
  await playerRef.set(player);
  await setUsersCurrentLobby(userID, lobbyID);
  logger.info(`User ${userName} (${userID}) joined lobby ${lobbyID} as ${role}`);
}