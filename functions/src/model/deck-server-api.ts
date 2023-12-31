import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase-server";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "../shared/firestore-converters";
import { RNG } from "../shared/rng";
import {
  DeckCard,
  PromptCardInGame,
  ResponseCardInGame
} from "../shared/types";
import { getPlayerDataRef, getPlayerHand, getTurnsRef } from "./turn-server-api";

function getDeckPromptsRef(deckID: string) {
  return db.collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
}

function getDeckResponsesRef(deckID: string) {
  return db.collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
}

/** Converts Prompt cards from a deck to a in-game Prompt cards. */
export async function getAllPromptsForGame(deckID: string):
  Promise<Array<PromptCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp("prompts");
  return (await getDeckPromptsRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      getCardIndex(card, rng), card.content, card.pick, card.rating, false);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Converts Response cards from a deck to a in-game Response cards. */
export async function getAllResponsesForGame(deckID: string):
  Promise<Array<ResponseCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp("responses");
  return (await getDeckResponsesRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      getCardIndex(card, rng), card.content, card.rating, false);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Creates prefixed ID to prevent collisions between decks. */
function prefixID(deckID: string, cardID: string): string {
  return `${deckID}_${cardID}`;
}

/** Calculates card's shuffling index, adjusting based on win/discard statistics */
function getCardIndex(card: DeckCard, rng: RNG): number {
  const base = rng.randomInt();
  // TODO: enable this based on lobby settings.
  let factor = (100.0 + card.rating) / 100.0 *
    (card.plays + 1.0) *
    10.0 / (card.views + 10.0) *
    (2 * card.wins + 1.0) *
    1.0 / (card.discards + 1.0);
  factor = Math.max(0.0001, factor);
  factor = Math.min(factor, 1.2);
  const result = (base * factor) >>> 0;
  // logger.debug(`Shuffle: base ${base} * factor ${factor} = ${result}`);
  return result;
}

export interface LogData {
  viewedPrompts?: PromptCardInGame[],
  viewedResponses?: ResponseCardInGame[],
  playedPrompts?: PromptCardInGame[],
  playedResponses?: ResponseCardInGame[],
  discardedPrompts?: PromptCardInGame[],
  discardedResponses?: ResponseCardInGame[],
  wonResponses?: ResponseCardInGame[],
}

/** Increments the "views" and "plays" counts on the given cards. */
export async function logCardInteractions(logData: LogData) {
  await db.runTransaction(async (transaction) => {
    for (const prompt of logData.viewedPrompts || []) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const prompt of logData.playedPrompts || []) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const prompt of logData.discardedPrompts || []) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.viewedResponses || []) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const response of logData.playedResponses || []) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const response of logData.discardedResponses || []) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.wonResponses || []) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { wins: FieldValue.increment(1) });
    }
  });
}

/** Iterates through all turns and all player's cards, checks for downvotes,
 * and updates ratings on the card in deck. */
export async function logDownvotes(lobbyID: string) {
  const downvotedCards = new Array<ResponseCardInGame>();
  // get turn IDs without loading them:
  const turnSnaps = (await getTurnsRef(lobbyID).get()).docs;
  for (const turnSnap of turnSnaps) {
    const playerDataSnaps = (await getPlayerDataRef(lobbyID, turnSnap.id).get()).docs;
    for (const playerDataSnap of playerDataSnaps) {
      const hand = await getPlayerHand(lobbyID, turnSnap.id, playerDataSnap.id);
      for (const card of hand) {
        if (card.downvoted) downvotedCards.push(card);
      }
    }
  }
  await db.runTransaction(async (transaction) => {
    for (const card of downvotedCards) {
      const cardRef = getDeckResponsesRef(card.deck_id).doc(card.card_id_in_deck);
      transaction.update(cardRef, { rating: FieldValue.increment(-1) });
    }
  });
}