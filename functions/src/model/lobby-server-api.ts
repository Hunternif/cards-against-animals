import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db, getPlayersRef, lobbiesRef } from "../firebase-server";
import {
  GameLobby,
  PlayerInLobby,
  PromptDeckCard,
  ResponseDeckCard
} from "../shared/types";
import { getUserName } from "./auth-api";
import { getAllPromptsPrefixed, getAllResponsesPrefixed } from "./deck-server-api";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "./firebase-converters";
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

/** Finds lobby by ID, or throws HttpsError */
export async function getLobby(lobbyID: string): Promise<GameLobby> {
  const lobby = (await lobbiesRef.doc(lobbyID).get()).data();
  if (!lobby) throw new HttpsError("not-found", `Lobby not found: ${lobbyID}`);
  return lobby;
}

export async function updateLobby(lobby: GameLobby): Promise<void> {
  await lobbiesRef.doc(lobby.id).set(lobby);
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
  if (lobby.status == "ended") {
    throw new HttpsError("unavailable", `Lobby already ended: ${lobbyID}`);
  }
  const role = (lobby.status == "new") ? "player" : "spectator";
  const player = new PlayerInLobby(userID, userName, role);
  await playerRef.set(player);
  await setUsersCurrentLobby(userID, lobbyID);
  logger.info(`User ${userName} (${userID}) joined lobby ${lobbyID} as ${role}`);
}

/**
 * Copy cards from all the decks into the lobby.
 * Copy the content because the deck could be edited or deleted in the future.
 */
export async function copyDecksToLobby(lobby: GameLobby): Promise<void> {
  const deckIDs = Array.from(lobby.deck_ids);
  const newPrompts = new Array<PromptDeckCard>();
  const newResponses = new Array<ResponseDeckCard>();
  // Copy all decks in sequence:
  // (sorry I failed to do parallel...)
  // See https://stackoverflow.com/a/37576787/1093712
  for (const deckID of lobby.deck_ids) {
    const prompts = await getAllPromptsPrefixed(deckID);
    newPrompts.push(...prompts);
    const responses = await getAllResponsesPrefixed(deckID);
    newResponses.push(...responses);
    logger.info(`Fetched ${prompts.length} prompts and ${responses.length} responses from deck ${deckID}`);
  }
  // Write all cards to the lobby:
  const lobbyPromptsRef = db.collection(`lobbies/${lobby.id}/deck_prompts`)
    .withConverter(promptDeckCardConverter);
  const lobbyResponsesRef = db.collection(`lobbies/${lobby.id}/deck_responses`)
    .withConverter(responseDeckCardConverter);
  await db.runTransaction(async (transaction) => {
    newPrompts.forEach((card) =>
      transaction.set(lobbyPromptsRef.doc(card.id), card));
    newResponses.forEach((card) =>
      transaction.set(lobbyResponsesRef.doc(card.id), card));
  });
  logger.info(`Copied ${newPrompts.length} prompts and ${newResponses.length} responses to lobby ${lobby.id}`);
}

