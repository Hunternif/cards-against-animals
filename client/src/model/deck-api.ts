import { collection, doc, getCountFromServer, getDocs, runTransaction } from "firebase/firestore";
import { db, decksRef } from "../firebase";
import { deckTagConverter, promptDeckCardConverter, responseDeckCardConverter } from "../shared/firestore-converters";
import { Deck, DeckTag, PromptDeckCard, ResponseDeckCard } from "../shared/types";

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
      return new PromptDeckCard(id, text, pick, 0, 0, 0, 0, [], 0, 0);
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
  const tagsInCards = new Array<string>();
  // Skip row of headers
  if (cardLines[0].startsWith("Type")) cardLines.splice(0, 1);
  cardLines.forEach((line, i) => {
    const id = String(i + 1).padStart(4, '0');
    const items = line.split("\t");
    const type = items[0];
    const rawText = items[1];
    const tags = items.splice(2).filter((c) => c != "");
    tagsInCards.push(...tags);
    if (type === "Prompt") {
      const text = processPromptText(processCardText(rawText));
      const pick = parsePromptPick(text);
      deck.prompts.push(new PromptDeckCard(id, text, pick, 0, 0, 0, 0, tags, 0, 0));
    } else if (type === "Response") {
      const text = processCardText(items[1]);
      deck.responses.push(new ResponseDeckCard(id, text, 0, 0, 0, 0, 0, 0, tags));
    }
  });

  // Tags accumulated so far:
  const tagMap = new Map<string, DeckTag>();
  for (const tag of tagsInCards) {
    tagMap.set(tag, new DeckTag(tag));
  }

  // Update tag descriptions:
  const tagLines = tagData.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "");
  if (tagLines.length > 0) {
    // Skip row of headers
    if (tagLines[0].startsWith("Tag")) tagLines.splice(0, 1);
    for (const line of tagLines) {
      const items = line.split("\t");
      const knownTag = tagMap.get(items[0]);
      if (knownTag) knownTag.description = items[1];
      else tagMap.set(items[0], new DeckTag(items[0], items[1]));
    }
  }
  deck.tags = Array.from(tagMap.values());
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
  text = text.replace(/(^|\s)_([\s.,:;!?\-~]|$)/g, "$1_$2");
  return text;
}

/** 🦌 */
export function detectDeer(text: string): boolean {
  const lowText = text.toLowerCase();
  return /(^|\s)олен/.test(lowText) ||
    /(^|\s)арви/.test(lowText) ||
    lowText.includes("🦌");
}

/** 👑 */
export function detectLenich(text: string): boolean {
  const lowText = text.toLowerCase();
  return /(^|\s)ленич/.test(lowText) || lowText.includes("👑");
}

/**
 * Returns true if the string contains only emojis and whitespace.
 * From https://stackoverflow.com/a/73634247/1093712
 */
export function isOnlyEmojis(str: string): boolean {
  const stringToTest = str.replace(/\s/g, '');
  const emojiRegex = /^(?:(?:\p{RI}\p{RI}|\p{Emoji}(?:\p{Emoji_Modifier}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?(?:\u{200D}\p{Emoji}(?:\p{Emoji_Modifier}|\u{FE0F}\u{20E3}?|[\u{E0020}-\u{E007E}]+\u{E007F})?)*)|[\u{1f900}-\u{1f9ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}])+$/u;
  return emojiRegex.test(stringToTest) && Number.isNaN(Number(stringToTest));
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