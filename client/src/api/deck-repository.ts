import {
  CollectionReference,
  Firestore,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import {
  deckConverter,
  deckTagConverter,
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "../shared/firestore-converters";
import {
  Deck,
  GeneratedDeck,
  PromptCardInGame,
  PromptDeckCard,
  ResponseDeckCard,
} from "../shared/types";

/** For accessing decks and cards from the server. */
export interface IDeckRepository {
  getPrompts(deckID: string): Promise<Array<PromptDeckCard>>;
  getResponses(deckID: string): Promise<Array<ResponseDeckCard>>;
  getDecks(): Promise<Array<Deck>>;
  getDecksWithCount(): Promise<Array<DeckWithCount>>;
  /** Loads complete content of a deck, with prompts and responses. */
  downloadDeck(deckID: string): Promise<Deck>;
  uploadDeck(deck: Deck): Promise<void>;
  /** Verifies that deck ID does not exist, and uploads data. */
  uploadNewDeck(deck: Deck): Promise<void>;
}

export class FirestoreDeckRepository implements IDeckRepository {
  private decksRef: CollectionReference<Deck>;
  constructor(private db: Firestore) {
    this.decksRef = collection(db, "decks").withConverter(deckConverter);
  }

  /** Returns Firestore subcollection reference of prompt cards in deck. */
  private getPromptsRef(deckID: string) {
    return collection(this.decksRef, deckID, "prompts").withConverter(
      promptDeckCardConverter
    );
  }

  /** Returns Firestore subcollection reference of response cards in deck. */
  private getResponsesRef(deckID: string) {
    return collection(this.decksRef, deckID, "responses").withConverter(
      responseDeckCardConverter
    );
  }

  async getPrompts(deckID: string): Promise<Array<PromptDeckCard>> {
    return (await getDocs(this.getPromptsRef(deckID))).docs.map((p) =>
      p.data()
    );
  }

  async getResponses(deckID: string): Promise<Array<ResponseDeckCard>> {
    return (await getDocs(this.getResponsesRef(deckID))).docs.map((p) =>
      p.data()
    );
  }

  async getDecks(): Promise<Array<Deck>> {
    return (await getDocs(this.decksRef)).docs.map((p) => p.data());
  }

  /**
   * Keeps the contents of the loaded decks, so there's no need to re-load it.
   * Maps deck ID to deck instance with its prompts and responses loaded.
   */
  private deckCache: Map<string, Deck> = new Map<string, Deck>();

  /**
   * Loads complete content of a deck, with prompts and responses, and stores it
   * in cache. Calling this multiple times for the same deck ID should not trigger
   * a network request.
   * Throws exception if the deck doesn't exist.
   */
  async downloadDeck(deckID: string): Promise<Deck> {
    const existingDeck = this.deckCache.get(deckID);
    if (existingDeck) return existingDeck;
    // Fetch deck from Firestore:
    const deck = (await getDoc(doc(this.decksRef, deckID))).data();
    if (!deck) throw new Error(`Deck "${deckID}" does not exist`);
    const [proDocs, resDocs] = await Promise.all([
      getDocs(this.getPromptsRef(deckID)),
      getDocs(this.getResponsesRef(deckID)),
    ]);
    deck.prompts = proDocs.docs.map((d) => d.data());
    deck.responses = resDocs.docs.map((d) => d.data());
    this.deckCache.set(deckID, deck);
    return deck;
  }

  /** Fetches all decks' data and counts cards in each. */
  async getDecksWithCount(): Promise<Array<DeckWithCount>> {
    const decks = await this.getDecks();
    const result = new Array<DeckWithCount>(decks.length);
    for (const deck of decks) {
      const promptCount = (
        await getCountFromServer(this.getPromptsRef(deck.id))
      ).data().count;
      const responseCount = (
        await getCountFromServer(this.getResponsesRef(deck.id))
      ).data().count;
      result.push({ ...deck, promptCount, responseCount });
    }
    return result;
  }

  /** Verifies that deck ID does not exist, and uploads data. */
  async uploadNewDeck(deck: Deck) {
    if ((await getDoc(doc(this.decksRef, deck.id))).exists()) {
      throw new Error(`Deck "${deck.title}" already exists`);
    }
    await this.uploadDeck(deck);
  }

  /** Note: this is called both for uploading new and existing decks. */
  async uploadDeck(deck: Deck) {
    await runTransaction(this.db, async (transaction) => {
      const docRef = doc(this.decksRef, deck.id);
      transaction.set(docRef, deck);
      // Now upload all the cards, in sequence:
      const promptsRef = collection(docRef, "prompts").withConverter(
        promptDeckCardConverter
      );
      deck.prompts.forEach((prompt) => {
        transaction.set(doc(promptsRef, prompt.id), prompt);
      });
      const responsesRef = collection(docRef, "responses").withConverter(
        responseDeckCardConverter
      );
      deck.responses.forEach((response) => {
        transaction.set(doc(responsesRef, response.id), response);
      });
      const tagsRef = collection(docRef, "tags").withConverter(
        deckTagConverter
      );
      deck.tags.forEach((tag) => {
        transaction.set(doc(tagsRef, tag.name), tag);
      });
    });
    this.deckCache.set(deck.id, deck);
  }
}

export interface DeckWithCount {
  id: string;
  title: string;
  promptCount: number;
  responseCount: number;
}

export const haikuPrompt3 = new PromptCardInGame(
  "haiku_3",
  GeneratedDeck.id,
  "haiku_3",
  0,
  "Make a haiku:\n_\n_\n_",
  3,
  0,
  []
);
export const haikuPrompt4 = new PromptCardInGame(
  "haiku_4",
  GeneratedDeck.id,
  "haiku_4",
  0,
  "Make a haiku:\n_\n_\n_\n_",
  4,
  0,
  []
);
export const haikuPrompt5 = new PromptCardInGame(
  "haiku_5",
  GeneratedDeck.id,
  "haiku_5",
  0,
  "Make a haiku:\n_\n_\n_\n_\n_",
  5,
  0,
  []
);
export const haikuPrompt6 = new PromptCardInGame(
  "haiku_6",
  GeneratedDeck.id,
  "haiku_6",
  0,
  "Make a haiku:\n_\n_\n_\n_\n_\n_",
  6,
  0,
  []
);