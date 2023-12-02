import { doc, getDoc, setDoc } from "firebase/firestore";
import { decksRef } from "../firebase";
import { Deck, PromptDeckCard, ResponseDeckCard } from "./types";

/**
 * Parses collection data. `promptList` and `responseList` are strings where
 * each line is a new entry.
 */
export function parseDeck(
  title: string,
  promptList: string,
  responseList: string,
): Deck {
  const deck = new Deck(title, title);
  deck.prompts = promptList.split("\n")
    .map((val) => val.trim())
    .filter((val) => val != "")
    // the new ID is the same as 'content':
    .map((val) => new PromptDeckCard(val, val, 0));
  deck.responses = responseList.split("\n")
    .map((val) => val.trim())
    .filter((val) => val != "")
    // the new ID is the same as 'content':
    .map((val) => new ResponseDeckCard(val, val, 0));
  return deck;
}

export async function uploadDeck(deck: Deck) {
  const docRef = doc(decksRef, deck.title);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    throw new Error(`Deck "${deck.title}" already exists`);
  }
  await setDoc(docRef, deck);
}
