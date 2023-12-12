import { collection, doc, getDoc, getDocs, runTransaction, setDoc, writeBatch } from "firebase/firestore";
import { db, decksRef, lobbiesRef } from "../firebase";
import { Deck, PromptDeckCard, ResponseDeckCard } from "../shared/types";
import { promptDeckCardConverter, responseDeckCardConverter } from "./firebase-converters";

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
    .map((line) => line.trim())
    .filter((line) => line != "")
    .map((line, i) => {
      const id = String(i + 1).padStart(4, '0');
      const pick = parsePromptPick(line);
      const text = processPromptText(processCardText(line));
      return new PromptDeckCard(id, text, pick, 0);
    });
  deck.responses = responseList.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "")
    .map((line, i) => {
      const id = String(i + 1).padStart(4, '0');
      const text = processCardText(line);
      return new ResponseDeckCard(id, text, 0);
    });
  return deck;
}

/** Extracts the number of gaps to fill, e.g.:
 * "I like __ and _" => 2. */
export function parsePromptPick(text: string): number {
  // Remove markup like "_words words_":
  text = text.replace(/(_[^_\s.,:;!?\-~]|[^_\s.,:;!?\-~]_)/g, "");
  const match = text.match(/(_+)/g);
  // Minimum number is 1, in case the __ is omitted.
  if (!match) return 1;
  // The first matched element is included twice:
  else return match.length;
}

/** Re-formats text if necessary */
export function processCardText(text: string): string {
  return text.replace("\\n", "\n");
}

/** Re-formats specifically the gaps in prompt cards */
export function processPromptText(text: string): string {
  text = text.replace(/_+/g, "_");
  text = text.replace(/(^|\s)_([\s\.,:;!?\-~]|$)/g, "$1___$2");
  return text;
}

export async function uploadDeck(deck: Deck) {
  await runTransaction(db, async (transaction) => {
    const docRef = doc(decksRef, deck.title);
    const docSnap = await transaction.get(docRef);
    if (docSnap.exists()) {
      throw new Error(`Deck "${deck.title}" already exists`);
    }
    transaction.set(docRef, deck);
    // Now upload all the cards, in sequence:
    const promptsRef = collection(docRef, 'prompts')
      .withConverter(promptDeckCardConverter);
    deck.prompts.forEach(prompt => {
      transaction.set(doc(promptsRef, prompt.id), prompt)
    });
    const responsesRef = collection(docRef, 'responses')
      .withConverter(responseDeckCardConverter);
    deck.responses.forEach(response => {
      transaction.set(doc(responsesRef, response.id), response)
    });
  });
}

export async function getDecks(): Promise<Array<Deck>> {
  return (await getDocs(decksRef)).docs.map((p) => p.data());
}

export async function getPrompts(deckID: string): Promise<Array<PromptDeckCard>> {
  const cardsRef = collection(decksRef, deckID, 'prompts')
    .withConverter(promptDeckCardConverter);
  return (await getDocs(cardsRef)).docs.map((p) => p.data());
}

export async function getResponses(deckID: string): Promise<Array<ResponseDeckCard>> {
  const cardsRef = collection(decksRef, deckID, 'responses')
    .withConverter(responseDeckCardConverter);
  return (await getDocs(cardsRef)).docs.map((p) => p.data());
}