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
} from "./firebase-converters";

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
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const prompt of playedPrompts) {
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const response of viewedResponses) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const response of playedResponses) {
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
  });
}