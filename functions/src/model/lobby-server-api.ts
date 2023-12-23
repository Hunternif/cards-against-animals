import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db, lobbiesRef } from "../firebase-server";
import {
  GameLobby,
  PlayerInLobby,
  PlayerRole,
  PromptCardInGame,
  ResponseCardInGame,
} from "../shared/types";
import { getUserName } from "./auth-api";
import {
  getAllPromptsForGame,
  getAllResponsesForGame
} from "./deck-server-api";
import {
  playerConverter,
  promptCardInGameConverter,
  responseCardInGameConverter
} from "../shared/firestore-converters";
import {
  getCAAUser,
  setUsersCurrentLobby,
  updateCAAUser
} from "./user-server-api";
import { dealCardsToPlayer, getLastTurn } from "./turn-server-api";

export function getPlayersRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/players`)
    .withConverter(playerConverter);
}

/** Finds current active lobby for this user, returns lobby ID. */
export async function findActiveLobbyWithPlayer(userID: string)
  : Promise<GameLobby | null> {
  // Current lobby is written in the 'users' collection:
  const caaUser = await getCAAUser(userID);
  if (!caaUser) return null;
  if (caaUser.current_lobby_id) {
    // Verify that lobby exists:
    const lobby = (await lobbiesRef.doc(caaUser.current_lobby_id).get()).data();
    if (lobby && lobby.status != "ended") return lobby;
    // Lobby doesn't exist, delete the record:
    delete caaUser.current_lobby_id;
    await updateCAAUser(caaUser);
    return null;
  }
  return null;
}

/**
 * Creates a new lobby from this player, returns it.
 */
export async function createLobby(userID: string): Promise<GameLobby> {
  // TODO: need to acquire lock. This doesn't prevent double lobby creation!
  const newLobbyRef = lobbiesRef.doc();
  const newID = newLobbyRef.id;
  const newLobby = new GameLobby(newID, userID, "new");
  await newLobbyRef.set(newLobby);
  logger.info(`Created new lobby from user: ${userID}`);
  return newLobby;
}

/** Finds lobby by ID, or throws HttpsError. */
export async function getLobby(lobbyID: string): Promise<GameLobby> {
  const lobby = (await lobbiesRef.doc(lobbyID).get()).data();
  if (!lobby) throw new HttpsError("not-found", `Lobby not found: ${lobbyID}`);
  return lobby;
}

/**
 * Updates lobby state in Firestore.
 * Does not update subcollections! (players, turns, deck etc)
 */
export async function updateLobby(lobby: GameLobby): Promise<void> {
  await lobbiesRef.doc(lobby.id).set(lobby);
}

/** Find player in this lobby. */
export async function getPlayer(lobbyID: string, userID: string):
  Promise<PlayerInLobby | null> {
  return (await getPlayersRef(lobbyID).doc(userID).get()).data() ?? null;
}

/** Returns all players in this lobby, by role. */
export async function getPlayers(lobbyID: string, role?: PlayerRole):
  Promise<Array<PlayerInLobby>> {
  if (!role) {
    // Fetch all players
    return (await getPlayersRef(lobbyID).get()).docs.map((p) => p.data());
  } else {
    return (await getPlayersRef(lobbyID)
      .where("role", "==", role).get()
    ).docs.map((p) => p.data());
  }
}

/**
 * Attempts to add player to lobby as "player",
 * or as "spectator" if the game is already in progress.
 */
export async function addPlayer(lobby: GameLobby, userID: string): Promise<void> {
  const userName = await getUserName(userID);
  const playersRef = getPlayersRef(lobby.id);
  const playerRef = playersRef.doc(userID);
  const hasAlreadyJoined = (await playerRef.get()).exists;
  if (hasAlreadyJoined) {
    logger.warn(`User ${userName} (${userID}) re-joined lobby ${lobby.id}`);
    return;
  }
  if (lobby.status == "ended") {
    throw new HttpsError("unavailable", `Lobby already ended: ${lobby.id}`);
  }
  // TODO: make it configurable in settings if new players can join.
  const role = "player";
  const player = new PlayerInLobby(userID, userName, role, "online");
  await playerRef.set(player);
  await setUsersCurrentLobby(userID, lobby.id);
  logger.info(`User ${userName} (${userID}) joined lobby ${lobby.id} as ${role}`);

  // deal cards to new player
  if (lobby.status == "in_progress") {
    const turn = await getLastTurn(lobby.id);
    if (!turn) {
      throw new HttpsError("failed-precondition",
        `Can't deal cards. Lobby ${lobby.id} is in progess but has no turns.`);
    }
    await dealCardsToPlayer(lobby.id, null, turn, userID);
  }
}

/**
 * Copy cards from all added decks into the lobby.
 * Copy the content because the deck could be edited or deleted in the future.
 */
export async function copyDecksToLobby(lobby: GameLobby): Promise<void> {
  const newPrompts = new Array<PromptCardInGame>();
  const newResponses = new Array<ResponseCardInGame>();
  // Copy all decks in sequence:
  // (sorry I failed to do parallel...)
  // See https://stackoverflow.com/a/37576787/1093712
  for (const deckID of lobby.deck_ids) {
    const prompts = await getAllPromptsForGame(deckID);
    newPrompts.push(...prompts);
    const responses = await getAllResponsesForGame(deckID);
    newResponses.push(...responses);
    logger.info(`Fetched ${prompts.length} prompts and ${responses.length} responses from deck ${deckID}`);
  }
  // Write all cards to the lobby:
  const lobbyPromptsRef = db.collection(`lobbies/${lobby.id}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const lobbyResponsesRef = db.collection(`lobbies/${lobby.id}/deck_responses`)
    .withConverter(responseCardInGameConverter);
  await db.runTransaction(async (transaction) => {
    newPrompts.forEach((card) =>
      transaction.set(lobbyPromptsRef.doc(card.id), card));
    newResponses.forEach((card) =>
      transaction.set(lobbyResponsesRef.doc(card.id), card));
  });
  logger.info(`Copied ${newPrompts.length} prompts and ${newResponses.length} responses to lobby ${lobby.id}`);
}
