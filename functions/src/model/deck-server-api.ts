import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase-server";
import {
  PromptCardInGame,
  ResponseCardInGame
} from "../shared/types";
import { randomIndex } from "../shared/utils";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "../shared/firestore-converters";
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
  return (await getDeckPromptsRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      randomIndex(), card.content, card.pick, card.rating, false);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Converts Response cards from a deck to a in-game Response cards. */
export async function getAllResponsesForGame(deckID: string):
  Promise<Array<ResponseCardInGame>> {
  return (await getDeckResponsesRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      randomIndex(), card.content, card.rating, false);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Creates prefixed ID to prevent collisions between decks. */
function prefixID(deckID: string, cardID: string): string {
  return `${deckID}_${cardID}`;
}

/** Increments the "views" and "plays" counts on the given cards. */
export async function logCardInteractions(
  viewedPrompts: PromptCardInGame[], viewedResponses: ResponseCardInGame[],
  playedPrompts: PromptCardInGame[], playedResponses: ResponseCardInGame[],
) {
  await db.runTransaction(async (transaction) => {
    for (const prompt of viewedPrompts) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const prompt of playedPrompts) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const response of viewedResponses) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const response of playedResponses) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
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