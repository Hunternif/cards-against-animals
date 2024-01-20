import { collection, doc, getCountFromServer, getDoc, getDocs, runTransaction, setDoc, writeBatch } from "firebase/firestore";
import { db, decksRef, lobbiesRef } from "../firebase";
import { Deck, DeckTag, PromptDeckCard, ResponseDeckCard } from "../shared/types";
import { deckTagConverter, promptDeckCardConverter, responseDeckCardConverter } from "../shared/firestore-converters";

/** Returns Firestore subcollection reference of prompt cards in deck. */
function getPromptsRef(deckID: string) {
  return collection(decksRef, deckID, 'prompts')
    .withConverter(promptDeckCardConverter);
}

/** Returns Firestore subcollection reference of response cards in deck. */
function getResponsesRef(deckID: string) {
  return collection(decksRef, deckID, 'responses')
    .withConverter(responseDeckCardConverter);
}

/**
 * Parses collection data. `promptList` and `responseList` are strings where
 * each line is a new entry.
 */
export function parseDeck(
  id: string,
  title: string,
  promptList: string,
  responseList: string,
): Deck {
  const deck = new Deck(id, title);
  deck.prompts = promptList.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "")
    .map((line, i) => {
      const id = String(i + 1).padStart(4, '0');
      const pick = parsePromptPick(line);
      const text = processPromptText(processCardText(line));
      return new PromptDeckCard(id, text, pick, 0, 0, 0, 0, []);
    });
  deck.responses = responseList.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "")
    .map((line, i) => {
      const id = String(i + 1).padStart(4, '0');
      const text = processCardText(line);
      return new ResponseDeckCard(id, text, 0, 0, 0, 0, 0, 0, []);
    });
  return deck;
}

/**
 * Parses deck TSV data
 */
export function parseDeckTsv(
  id: string,
  title: string,
  cardData: string,
  tagData: string,
): Deck {
  const deck = new Deck(id, title);
  const cardLines = cardData.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "");
  // Skip row of headers
  if (cardLines[0].startsWith("Type")) cardLines.splice(0, 1);
  cardLines.forEach((line, i) => {
    const id = String(i + 1).padStart(4, '0');
    const items = line.split("\t");
    const type = items[0];
    const rawText = items[1];
    const tags = items.splice(2).filter((c) => c != "");
    if (type === "Prompt") {
      const text = processPromptText(processCardText(rawText));
      const pick = parsePromptPick(text);
      deck.prompts.push(new PromptDeckCard(id, text, pick, 0, 0, 0, 0, tags));
    } else if (type === "Response") {
      const text = processCardText(items[1]);
      deck.responses.push(new ResponseDeckCard(id, text, 0, 0, 0, 0, 0, 0, tags));
    }
  });
  const tagLines = tagData.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "");
  // Skip row of headers
  if (tagLines[0].startsWith("Tag")) tagLines.splice(0, 1);
  deck.tags = tagLines.map((line) => {
    const items = line.split("\t");
    return new DeckTag(items[0], items[1]);
  });
  return deck;
}

/** Extracts the number of gaps to fill, e.g.:
 * "I like __ and _" => 2. */
export function parsePromptPick(text: string): number {
  // Remove markup like "_words words_":
  text = text.replace(/(_[^_"'«»\s.,:;!?\-~]|[^_"'«»\s.,:;!?\-~]_)/g, "");
  const match = text.match(/(_+)/g);
  // Minimum number is 1, in case the __ is omitted.
  if (!match) return 1;
  // The first matched element is included twice:
  else return match.length;
}

/** Re-formats text if necessary */
export function processCardText(text: string): string {
  return text.replace(/\\n/g, "\n");
}

/** Re-formats specifically the gaps in prompt cards, to be '_' */
export function processPromptText(text: string): string {
  text = text.replace(/_+/g, "_");
  text = text.replace(/(^|\s)_([\s\.,:;!?\-~]|$)/g, "$1_$2");
  return text;
}

/** 🦌 */
export function detectDeer(text: string): boolean {
  const lowText = text.toLowerCase();
  return lowText.match(/(^|\s)олен/) != null ||
    lowText.match(/(^|\s)арви/) != null ||
    lowText.includes("🦌");
}

/** 👑 */
export function detectLenich(text: string): boolean {
  const lowText = text.toLowerCase();
  return lowText.match(/(^|\s)ленич/) != null ||
    lowText.includes("👑");
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
    const tagsRef = collection(docRef, 'tags')
      .withConverter(deckTagConverter);
    deck.tags.forEach(tag => {
      transaction.set(doc(tagsRef, tag.name), tag);
    });
  });
}

export async function getDecks(): Promise<Array<Deck>> {
  return (await getDocs(decksRef)).docs.map((p) => p.data());
}

export interface DeckWithCount {
  id: string,
  title: string,
  promptCount: number,
  responseCount: number,
}

/** Fetches all decks' data and counts cards in each. */
export async function getDecksWithCount(): Promise<Array<DeckWithCount>> {
  const decks = await getDecks();
  const result = new Array<DeckWithCount>(decks.length);
  for (const deck of decks) {
    const promptCount = (await getCountFromServer(getPromptsRef(deck.id))).data().count;
    const responseCount = (await getCountFromServer(getResponsesRef(deck.id))).data().count;
    result.push({ ...deck, promptCount, responseCount });
  }
  return result;
}

export async function getPrompts(deckID: string): Promise<Array<PromptDeckCard>> {
  return (await getDocs(getPromptsRef(deckID))).docs.map((p) => p.data());
}

export async function getResponses(deckID: string): Promise<Array<ResponseDeckCard>> {
  return (await getDocs(getResponsesRef(deckID))).docs.map((p) => p.data());
}