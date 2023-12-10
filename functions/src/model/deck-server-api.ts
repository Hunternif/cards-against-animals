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

/** Returns all Prompt card, prefixed with deck ID */
export async function getAllPromptsInGame(deckID: string):
  Promise<Array<PromptCardInGame>> {
  const cardsRef = db.collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
  return (await cardsRef.get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      deckID, card.id, randomIndex(), card.content, card.rating);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Returns all Response card, prefixed with deck ID */
export async function getAllResponsesInGame(deckID: string):
  Promise<Array<ResponseCardInGame>> {
  const cardsRef = db.collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
  return (await cardsRef.get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      deckID, card.id, randomIndex(), card.content, card.rating);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

function randomIndex(): number {
  const time = Timestamp.now().nanoseconds;
  return getRandomInt(0, 2147483648) ^ time;
}