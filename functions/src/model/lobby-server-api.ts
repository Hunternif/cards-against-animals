import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db, lobbiesRef, usersRef } from "../firebase-server";
import {
  playerConverter,
  promptCardInGameConverter,
  responseCardInGameConverter
} from "../shared/firestore-converters";
import { RNG } from "../shared/rng";
import {
  GameLobby,
  PlayerInLobby,
  PlayerRole,
  PromptCardInGame,
  ResponseCardInGame,
  defaultLobbySettings
} from "../shared/types";
import { getUserName } from "./auth-api";
import {
  getAllPromptsForGame,
  getAllResponsesForGame
} from "./deck-server-api";
import { dealCardsToPlayer, getLastTurn } from "./turn-server-api";
import {
  getCAAUser,
  setUsersCurrentLobby,
  updateCAAUser
} from "./user-server-api";

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
  const newLobby = new GameLobby(newID, userID, defaultLobbySettings(), "new");
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

/** Updates player data in lobby in Firestore. */
export async function updatePlayer(lobbyID: string, player: PlayerInLobby) {
  await getPlayersRef(lobbyID).doc(player.uid).set(player);
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

/** Get active "online" players, usable for game functions. */
export async function getOnlinePlayers(lobbyID: string):
  Promise<Array<PlayerInLobby>> {
  return (await getPlayers(lobbyID))
    .filter((p) => p.role === "player" && p.status === "online");
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
  let role: PlayerRole = "spectator";
  if (lobby.status == "ended") {
    throw new HttpsError("unavailable", `Lobby already ended: ${lobby.id}`);
  } else if (lobby.status === "new") {
    role = "player";
  } else if (lobby.status === "in_progress" && lobby.settings.allow_join_mid_game) {
    role = "player";
  }
  const rng = RNG.fromStrSeedWithTimestamp(lobby.id + userName);
  const player = new PlayerInLobby(userID, userName, rng.randomInt(), role, "online", 0, 0);
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
    await dealCardsToPlayer(lobby, null, turn, userID);
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
    const prompts = await getAllPromptsForGame(deckID, lobby.settings);
    newPrompts.push(...prompts);
    const responses = await getAllResponsesForGame(deckID, lobby.settings);
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

/** Sets lobby status to "ended", and performs any cleanup */
export async function setLobbyEnded(lobby: GameLobby) {
  lobby.status = "ended";
  await updateLobby(lobby);
  // Unset current_lobby_id for all players:
  const players = await getPlayers(lobby.id);
  for (const player of players) {
    const caaUser = await getCAAUser(player.uid);
    if (caaUser) {
      if (caaUser.current_lobby_id === lobby.id) {
        await usersRef.doc(player.uid).update(
          { current_lobby_id: FieldValue.delete() }
        );
      }
    }
  }
  logger.info(`Ended lobby ${lobby.id}`);
}

/**
 * Returns a sequence of player UIDs.
 * Next judge is selected by rotating it.
 * The sequence must be stable!
 */
export async function getPlayerSequence(lobbyID: string): Promise<Array<PlayerInLobby>> {
  const players = await getOnlinePlayers(lobbyID);
  // Sort players by random_index:
  return players.sort((a, b) => a.random_index - b.random_index);
}

/** Returns the next player in the sequence after the given userID. */
export function findNextPlayer(
  sequence: Array<PlayerInLobby>, userID?: string,
): PlayerInLobby | null {
  if (sequence.length === 0) return null;
  const lastIndex = sequence.findIndex((p) => p.uid === userID);
  if (lastIndex === -1) return sequence[0];
  let nextIndex = lastIndex + 1;
  if (nextIndex >= sequence.length) nextIndex = 0;
  return sequence[nextIndex];
}