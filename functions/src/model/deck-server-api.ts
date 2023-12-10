import { db, decksRef } from "../firebase-server";
import { DeckCard, PromptDeckCard, ResponseDeckCard } from "../shared/types";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "./firebase-converters";

/** Returns all Prompt card, prefixed with deck ID */
export async function getAllPromptsPrefixed(deckID: string):
  Promise<Array<PromptDeckCard>> {
  const cardsRef = db.collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
  return (await cardsRef.get()).docs
    .map((p) => prefixCardID(p.data(), deckID));
}

/** Returns all Response card, prefixed with deck ID */
export async function getAllResponsesPrefixed(deckID: string):
  Promise<Array<ResponseDeckCard>> {
  const cardsRef = db.collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
  return (await cardsRef.get()).docs
    .map((p) => prefixCardID(p.data(), deckID));
}

/** Prefixes card ID with its deck ID, to prevent collisions between decks. */
function prefixCardID<T extends DeckCard>(card: T, deckID: string): T {
  card.id = `${deckID}_${card.id}`;
  return card;
}