// Server APIs for game turns, when the game is in progress.

import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase-server";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  turnConverter
} from "../shared/firestore-converters";
import {
  GameTurn,
  PlayerDataInTurn,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame
} from "../shared/types";
import { getOnlinePlayers, getPlayer, getPlayers, updatePlayer } from "./lobby-server-api";
import { logCardInteractions } from "./deck-server-api";

/** Returns Firestore subcollection reference. */
export function getTurnsRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/turns`).withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
export function getPlayerDataRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data`)
    .withConverter(playerDataConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerHandRef(lobbyID: string, turnID: string, userID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/hand`)
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses`)
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerDiscardRef(lobbyID: string, turnID: string, userID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/discarded`)
    .withConverter(responseCardInGameConverter);
}

/** Returns all turns that occurred in this lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getTurnsRef(lobbyID).get()).docs.map((t) => t.data());
}

/** Finds turn by ID, or throws HttpsError. */
export async function getTurn(lobbyID: string, turnID: string):
  Promise<GameTurn> {
  const turn = (await getTurnsRef(lobbyID).doc(turnID).get()).data();
  if (!turn) throw new HttpsError("not-found", `Turn ${turnID} not found in lobby ${lobbyID}`);
  return turn;
}

/** Finds the last turn in the lobby. */
export async function getLastTurn(lobbyID: string): Promise<GameTurn | null> {
  const docs = (await getTurnsRef(lobbyID)
    .orderBy("time_created", "desc")
    .limit(1).get()
  ).docs;
  if (docs.length === 0) return null;
  return docs[0].data();
}

/**
 * Updates turn state in Firestore.
 * Does not update subcollections! (player_data, player_resposnes etc)
 */
export async function updateTurn(lobbyID: string, turn: GameTurn): Promise<void> {
  await getTurnsRef(lobbyID).doc(turn.id).set(turn);
}

/** Counts how many turns have occurred in this lobby. */
export async function countTurns(lobbyID: string): Promise<number> {
  return (await getTurnsRef(lobbyID).count().get()).data().count;
}

/** Data from a specific player, from a specific turn. */
export async function getPlayerData(
  lobbyID: string, turnID: string, uid: string
): Promise<PlayerDataInTurn | null> {
  return (await getPlayerDataRef(lobbyID, turnID).doc(uid).get()).data() ?? null;
}

/** Data from all players, from a specific turn. */
export async function getAllPlayerData(lobbyID: string, turnID: string):
  Promise<PlayerDataInTurn[]> {
  return (await getPlayerDataRef(lobbyID, turnID).get())
    .docs.map((d) => d.data());
}

/** Hand from a specific player, from a specific turn. */
export async function getPlayerHand(
  lobbyID: string, turnID: string, uid: string
): Promise<ResponseCardInGame[]> {
  return (await getPlayerHandRef(lobbyID, turnID, uid).get())
    .docs.map((t) => t.data());
}

/** Discarded cards from a specific player, from a specific turn. */
export async function getPlayerDiscard(
  lobbyID: string, turnID: string, uid: string
): Promise<ResponseCardInGame[]> {
  return (await getPlayerDiscardRef(lobbyID, turnID, uid).get())
    .docs.map((t) => t.data());
}

/** Responses from all players in this turn. */
export async function getPlayerResponse(
  lobbyID: string, turnID: string, userID: string
): Promise<PlayerResponse | null> {
  return (await getPlayerResponsesRef(lobbyID, turnID).doc(userID).get())
    .data() ?? null;
}

/** Responses from all players in this turn. */
export async function getAllPlayerResponses(lobbyID: string, turnID: string):
  Promise<Array<PlayerResponse>> {
  return (await getPlayerResponsesRef(lobbyID, turnID).get()).docs.map((t) => t.data());
}

/**
 * Creates a new turn without a prompt, and returns it.
 */
export async function createNewTurn(lobbyID: string): Promise<GameTurn> {
  const lastTurn = await getLastTurn(lobbyID);
  // Allow players to start a new turn whenever:
  // if (lastTurn && lastTurn.phase != "complete") {
  //   throw new HttpsError("failed-precondition",
  //     `Last turn has not completed in lobby ${lobbyID}`);
  // }
  const judge = await selectJudge(lobbyID, lastTurn);
  const newOrdinal = lastTurn ? (lastTurn.ordinal + 1) : 1;
  const id = String(newOrdinal).padStart(2, '0');
  const newTurn = new GameTurn(id, newOrdinal, judge);
  await getTurnsRef(lobbyID).doc(id).set(newTurn);
  await dealCards(lobbyID, lastTurn, newTurn);
  return newTurn; // timestamp may not have reloaded but that's ok.
}

/**
 * Starts the turn and returns it.
 */
export async function startTurn(lobbyID: string, turnID: string): Promise<GameTurn> {
  const turn = await getTurn(lobbyID, turnID);
  turn.phase = "answering";
  await updateTurn(lobbyID, turn);
  return turn;
}

/** Returns UID of the player who will judge the next turn. */
async function selectJudge(lobbyID: string, lastTurn: GameTurn | null):
  Promise<string> {
  const sequence = await getPlayerSequence(lobbyID);
  const lastIndex = lastTurn ? sequence.indexOf(lastTurn.judge_uid) : -1;
  if (lastIndex === -1) return sequence[0];
  let nextIndex = lastIndex + 1;
  if (nextIndex >= sequence.length) nextIndex = 0;
  return sequence[nextIndex];
}

/** Selects a new prompt card from the remaining deck. */
async function selectPrompt(lobbyID: string): Promise<PromptCardInGame> {
  const promptsRef = db.collection(`lobbies/${lobbyID}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const cards = (await promptsRef
    .orderBy("random_index")
    .limit(1).get()
  ).docs.map((c) => c.data());
  if (cards.length === 0) {
    throw new HttpsError("failed-precondition", "No more cards in deck");
  }
  const selected = cards[0];
  // Remove selected card from the remaining deck:
  await promptsRef.doc(selected.id).delete();
  return selected;
}

// TODO: move this to lobby settings
const cardsPerPerson = 10;

/** Deal cards to active players. */
async function dealCards(
  lobbyID: string, lastTurn: GameTurn | null, newTurn: GameTurn,
): Promise<void> {
  const players = await getOnlinePlayers(lobbyID);
  for (const player of players) {
    await dealCardsToPlayer(lobbyID, lastTurn, newTurn, player.uid);
  }
}

/** Deal cards to a given player, up to the limit. */
export async function dealCardsToPlayer(
  lobbyID: string, lastTurn: GameTurn | null, newTurn: GameTurn, userID: string,
) {
  const deckResponsesRef = db.collection(`lobbies/${lobbyID}/deck_responses`)
    .withConverter(responseCardInGameConverter);
  const player = await getPlayer(lobbyID, userID);
  if (!player) {
    throw new HttpsError("not-found", `Player data not found for user ${userID}`);
  }
  const newPlayerData = new PlayerDataInTurn(userID, player.name);
  if (lastTurn) {
    const lastResponse = await getPlayerResponse(lobbyID, lastTurn.id, userID);
    const lastDiscard = await getPlayerDiscard(lobbyID, lastTurn.id, userID);
    // copy old hand, without the submitted and discarded cards:
    const oldHand = (await getPlayerHand(lobbyID, lastTurn.id, userID))
      ?.filter((card) => !lastResponse?.cards?.find((c) => c.id === card.id))
      ?.filter((card) => !lastDiscard.find((c) => c.id === card.id));
    // temporarily write hand here, then upload it as a subcollection
    newPlayerData.hand.push(...oldHand);
  }
  // Find how many more cards we need:
  const totalCardsNeeded = Math.max(0, cardsPerPerson - newPlayerData.hand.length);

  // Fetch new cards:
  const newCards = totalCardsNeeded <= 0 ? [] : (await deckResponsesRef
    .orderBy("random_index", "desc")
    .limit(totalCardsNeeded).get()
  ).docs.map((c) => c.data());
  // Add cards to the new player hand
  newPlayerData.hand.push(...newCards);
  // If we ran out of cards, sorry!

  // Remove dealt cards from the deck and upload player data & hand:
  const playerDataRef = getPlayerDataRef(lobbyID, newTurn.id);
  await db.runTransaction(async (transaction) => {
    for (const card of newCards) {
      transaction.delete(deckResponsesRef.doc(card.id));
    }
    transaction.set(playerDataRef.doc(userID), newPlayerData);
    const handRef = getPlayerHandRef(lobbyID, newTurn.id, userID);
    for (const card of newPlayerData.hand) {
      transaction.set(handRef.doc(card.id), card);
    }
  });
  logger.info(`Dealt ${newCards.length} cards to player ${userID}`);
}

/**
 * Returns a sequence of player UIDs.
 * Next judge is selected by rotating it.
 * The sequence must be stable!
 */
async function getPlayerSequence(lobbyID: string): Promise<Array<string>> {
  const players = await getOnlinePlayers(lobbyID);
  // Simply sort players by UIDs:
  const uids = players.map((p) => p.uid);
  return uids.sort();
}

/** Updates all player's scores from this turn, if it has ended. */
export async function updatePlayerScoresFromTurn(
  lobbyID: string, turn: GameTurn,
) {
  const players = await getPlayers(lobbyID, "player");
  for (const player of players) {
    if (turn.winner_uid === player.uid) {
      player.score++;
    }
    const discardRef = getPlayerDiscardRef(lobbyID, turn.id, player.uid);
    const discardCount = (await discardRef.count().get()).data().count;
    if (discardCount > 0) {
      player.score--;
    }
    await updatePlayer(lobbyID, player);
  }
}

/** Log interaction for the played prompt. */
export async function logPlayedPrompt(lobbyID: string, turn: GameTurn) {
  if (!turn.prompt) {
    logger.warn(`Answering phase without a prompt. Lobby ${lobbyID} turn ${turn.id}`);
    return;
  }
  await logCardInteractions({ viewedPrompts: [turn.prompt], playedPrompts: [turn.prompt] });
}

/**
 * Log interactions from the completed turn:
 * - viewed hand
 * - played responses
 * - discards
 */
export async function logPlayerHandInteractions(lobbyID: string, turn: GameTurn) {
  // Played cards:
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  const playedResponses = responses.reduce((array, resp) => {
    array.push(...resp.cards);
    return array;
  }, new Array<ResponseCardInGame>());
  // Discarded cards:
  const playerData = await getAllPlayerData(lobbyID, turn.id);
  const discardedResponses = new Array<ResponseCardInGame>();
  const viewedResponses = new Array<ResponseCardInGame>();
  for (const pData of playerData) {
    if (pData.player_uid === turn.judge_uid) {
      // Skip judge, they didn't see their hand:
      continue;
    }
    const hand = await getPlayerHand(lobbyID, turn.id, pData.player_uid);
    viewedResponses.push(...hand);
    const discarded = await getPlayerDiscard(lobbyID, turn.id, pData.player_uid);
    discardedResponses.push(...discarded);
  }
  await logCardInteractions({ viewedResponses, playedResponses, discardedResponses });
}

/** Log interaction for the winning response. */
export async function logWinner(lobbyID: string, turn: GameTurn) {
  if (!turn.winner_uid) return;
  const winnerResponse = await getPlayerResponse(lobbyID, turn.id, turn.winner_uid);
  if (!winnerResponse) return;
  await logCardInteractions({ wonResponses: winnerResponse.cards });
}