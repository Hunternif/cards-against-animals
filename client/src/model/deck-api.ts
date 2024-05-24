import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db, decksRef } from "../firebase";
import { deckTagConverter, promptDeckCardConverter, responseDeckCardConverter } from "../shared/firestore-converters";
import {
  Deck,
  DeckCard,
  DeckTag,
  PromptCardInGame,
  PromptDeckCard,
  ResponseDeckCard,
} from "../shared/types";

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
 * Keeps the contents of the loaded decks, so there's no need to re-load it.
 * Maps deck ID to deck instance with its prompts and responses loaded.
 */
const deckCache: Map<string, Deck> = new Map<string, Deck>();

/**
 * Loads complete content of a deck, with prompts and responses, and stores it
 * in cache. Calling this multiple times for the same deck ID should not trigger
 * a network request.
 * Throws exception if the deck doesn't exist.
 */
export async function loadDeck(deckID: string): Promise<Deck> {
  const existingDeck = deckCache.get(deckID);
  if (existingDeck) return existingDeck;
  // Fetch deck from Firestore:
  const deck = (await getDoc(doc(decksRef, deckID))).data();
  if (!deck) throw new Error(`Deck "${deckID}" does not exist`);
  const [proDocs, resDocs] = await Promise.all([
    getDocs(getPromptsRef(deckID)),
    getDocs(getResponsesRef(deckID))
  ]);
  deck.prompts = proDocs.docs.map((d) => d.data());
  deck.responses = resDocs.docs.map((d) => d.data());
  deckCache.set(deckID, deck);
  return deck;
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
      const id = cardOrdinalToID(i + 1);
      const pick = parsePromptPick(line);
      const text = processPromptText(processCardText(line));
      return new PromptDeckCard(id, text, pick, 0, 0, 0, 0, [], 0, 0);
    });
  const promptCount = deck.prompts.length;
  deck.responses = responseList.split("\n")
    .map((line) => line.trim())
    .filter((line) => line != "")
    .map((line, i) => {
      const id = cardOrdinalToID(promptCount + i + 1);
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
  if (cardLines.length > 0 && cardLines[0].startsWith("Type")) {
    cardLines.splice(0, 1);
  }
  cardLines.forEach((line, i) => {
    const id = cardOrdinalToID(i + 1);
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

function cardOrdinalToID(ordinal: number) {
  return String(ordinal).padStart(4, '0');
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
  return /(^|\s)ленич/.test(lowText) ||
    /(^|\s)леонид/.test(lowText) ||
    lowText.includes("👑");
}

/** 🐈 */
export function detectCat(text: string): boolean {
  const lowText = text.toLowerCase();
  return /(^|\s)кот([\s,]|$)/.test(lowText) ||
    /(^|\s)котик([\s,]|$)/.test(lowText) ||
    /(^|\s)кошьк/.test(lowText) ||
    /(^|\s)кошк/.test(lowText) ||
    /(^|\s)мяу/.test(lowText) ||
    lowText.includes("🐈");
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

/** Verifies that deck ID does not exist, and uploads data. */
export async function uploadNewDeck(deck: Deck) {
  if ((await getDoc(doc(decksRef, deck.id))).exists()) {
    throw new Error(`Deck "${deck.title}" already exists`);
  }
  await uploadDeck(deck);
}

/** Note: this is called both for uploading new and existing decks. */
export async function uploadDeck(deck: Deck) {
  await runTransaction(db, async (transaction) => {
    const docRef = doc(decksRef, deck.id);
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
  deckCache.set(deck.id, deck);
}

/**
 * Loads destination deck, appends new values from source deck, uploads data.
 * IDs of source deck will be changed to prevent collisions.
 */
export async function mergeDecks(dest: Deck, source: Deck): Promise<Deck> {
  // Assuming card ID format to be '0001'.
  const idRegex = /^\d{4}$/;
  let topID = -1;
  const usedIDs = new Set<string>();
  function processExistingID(idStr: string) {
    usedIDs.add(idStr);
    if (idRegex.test(idStr)) {
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        topID = Math.max(topID, id);
      }
    }
  }
  function updateCardID<T extends DeckCard>(card: T): T {
    if (topID > -1 && idRegex.test(card.id)) {
      const iCardID = parseInt(card.id);
      if (!isNaN(iCardID)) {
        let newID = cardOrdinalToID(topID + iCardID);
        if (usedIDs.has(newID)) {
          throw Error(`Couldn't merge. Duplicate ID ${newID}`);
        }
        usedIDs.add(newID);
        card.id = newID;
      }
    }
    return card;
  }
  dest.prompts.forEach((card) => processExistingID(card.id));
  dest.responses.forEach((card) => processExistingID(card.id));
  dest.prompts.push(...source.prompts.map((card) => updateCardID(card)));
  dest.responses.push(...source.responses.map((card) => updateCardID(card)));
  // Merge tags:
  const tagMap = new Map<string, DeckTag>(dest.tags.map((tag) => [tag.name, tag]));
  source.tags.forEach((newTag) => { tagMap.set(newTag.name, newTag) });
  dest.tags = Array.from(tagMap.values());
  return dest;
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

export const generatedDeck = new Deck("generated", "Generated cards");
export const haikuPrompt = new PromptCardInGame(
  "haiku", generatedDeck.id, "haiku", 0, "Make a haiku:\n_\n_\n_", 3, 0, [],
);