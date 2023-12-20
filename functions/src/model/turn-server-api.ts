// Server APIs for game turns, when the game is in progress.

import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase-server";
import { GameTurn, PlayerDataInTurn, PlayerResponse, PromptCardInGame } from "../shared/types";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  turnConverter
} from "./firebase-converters";
import { getPlayers } from "./lobby-server-api";

/** Returns Firestore subcollection reference. */
function getTurnsRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/turns`).withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerDataRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data`)
    .withConverter(playerDataConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses`)
    .withConverter(playerResponseConverter);
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
  const id = String(await countTurns(lobbyID) + 1);
  const newTurn = new GameTurn(id, judge);
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
  const deckResponsesRef = db.collection(`lobbies/${lobbyID}/deck_responses`)
    .withConverter(responseCardInGameConverter);
  const players = await getPlayers(lobbyID, "player");
  // Map last turn's responses by player uid:
  const lastResponses = new Map(
    (lastTurn ? await getAllPlayerResponses(lobbyID, lastTurn.id) : [])
      .map((r) => [r.player_uid, r])
  );
  const newPlayerData = players.map((p) => new PlayerDataInTurn(p.uid, p.name));
  // Find how many more cards we need:
  let totalCardsNeeded = 0;
  for (const pData of newPlayerData) {
    if (lastTurn) {
      // copy old hand, discarding submitted cards:
      const playedCardIds = new Set(
        lastResponses.get(pData.player_uid)?.cards?.map(c => c.card_id));
      const oldHand = (await getPlayerData(lobbyID, lastTurn.id, pData.player_uid))
        ?.hand?.filter(c => !playedCardIds.has(c.card_id)) || [];
      pData.hand.push(...oldHand);
    }
    totalCardsNeeded += Math.max(0, cardsPerPerson - pData.hand.length);
  }
  // Fetch new cards:
  const newCards = (await deckResponsesRef
    .orderBy("random_index")
    .limit(totalCardsNeeded).get()
  ).docs.map((c) => c.data());
  let i = 0;
  for (const pData of newPlayerData) {
    while (pData.hand.length < cardsPerPerson && i < newCards.length) {
      pData.hand.push(newCards[i]);
      i++;
    }
    // If we ran out of cards, sorry!
  }
  // Remove dealt cards from the deck and upload player data:
  const playerDataRef = getPlayerDataRef(lobbyID, newTurn.id);
  await db.runTransaction(async (transaction) => {
    for (const card of newCards) {
      transaction.delete(deckResponsesRef.doc(card.id));
    }
    for (const pData of newPlayerData) {
      transaction.set(playerDataRef.doc(pData.player_uid), pData);
    }
  });
}

/**
 * Returns a sequence of player UIDs.
 * Next judge is selected by rotating it.
 * The sequence must be stable!
 */
async function getPlayerSequence(lobbyID: string): Promise<Array<string>> {
  const players = await getPlayers(lobbyID, "player");
  // Simply sort players by UIDs:
  const uids = players.map((p) => p.uid);
  return uids.sort();
}
