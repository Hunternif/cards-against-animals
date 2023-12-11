import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase-server";
import {
  PromptCardInGame,
  ResponseCardInGame
} from "../shared/types";
import { getRandomInt } from "../shared/utils";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "./firebase-converters";

/** Converts Prompt cards from a deck to a in-game Prompt cards. */
export async function getAllPromptsForGame(deckID: string):
  Promise<Array<PromptCardInGame>> {
  const cardsRef = db.collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
  return (await cardsRef.get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      randomIndex(), card.content, card.pick, card.rating);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Converts Response cards from a deck to a in-game Response cards. */
export async function getAllResponsesForGame(deckID: string):
  Promise<Array<ResponseCardInGame>> {
  const cardsRef = db.collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
  return (await cardsRef.get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      randomIndex(), card.content, card.rating);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

function randomIndex(): number {
  const time = Timestamp.now().nanoseconds;
  return getRandomInt(0, 2147483648) ^ time;
}

/** Creates prefixed ID to prevent collisions between decks. */
function prefixID(deckID: string, cardID: string): string {
  return `${deckID}_${cardID}`;
}