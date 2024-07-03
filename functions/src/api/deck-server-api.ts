import { HttpsError } from 'firebase-functions/v1/auth';
import { firestore } from '../firebase-server';
import {
  deckConverter,
  promptDeckCardConverter,
  responseDeckCardConverter,
} from '../shared/firestore-converters';
import { IRNG, RNG } from '../shared/rng';
import {
  Deck,
  DeckCard,
  LobbySettings,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseDeckCard,
} from '../shared/types';

export function getDecksRef() {
  return firestore.collection(`decks`).withConverter(deckConverter);
}

export function getDeckPromptsRef(deckID: string) {
  return firestore
    .collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
}

export function getDeckResponsesRef(deckID: string) {
  return firestore
    .collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
}

export async function getDeck(deckID: string): Promise<Deck> {
  const deck = (await getDecksRef().doc(deckID).get()).data();
  if (deck == null)
    throw new HttpsError('not-found', `Deck not found: ${deckID}`);
  return deck;
}

export async function getAllDecks(): Promise<Deck[]> {
  return (await getDecksRef().get()).docs.map((d) => d.data());
}

export async function updateDeck(deck: Deck): Promise<void> {
  await getDecksRef().doc(deck.id).set(deck);
}

/** Loads complete content of a deck. with prompts and responses. */
export async function downloadDeck(deckID: string): Promise<Deck> {
  const deck = (await getDecksRef().doc(deckID).get()).data();
  if (!deck) throw new Error(`Deck "${deckID}" does not exist`);
  const [proDocs, resDocs] = await Promise.all([
    getDeckPromptsRef(deckID).get(),
    getDeckResponsesRef(deckID).get(),
  ]);
  deck.prompts = proDocs.docs.map((d) => d.data());
  deck.responses = resDocs.docs.map((d) => d.data());
  return deck;
}

/** Converts Prompt cards from a deck to a in-game Prompt cards. */
export async function getAllPromptsForGame(
  deckID: string,
  settings: LobbySettings,
): Promise<Array<PromptCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp('prompts');
  return (await getDeckPromptsRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      prefixID(deckID, card.id),
      deckID,
      card.id,
      getCardIndex(card, rng, settings),
      card.content,
      card.pick,
      card.rating,
      card.tags,
    );
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Converts Response cards from a deck to a in-game Response cards. */
export async function getAllResponsesForGame(
  deckID: string,
  settings: LobbySettings,
): Promise<Array<ResponseCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp('responses');
  return (await getDeckResponsesRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      prefixID(deckID, card.id),
      deckID,
      card.id,
      getCardIndex(card, rng, settings),
      card.content,
      card.rating,
      card.tags,
      card.action,
    );
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Creates prefixed ID to prevent collisions between decks. */
function prefixID(deckID: string, cardID: string): string {
  return `${deckID}_${cardID}`;
}

/** Calculates card's shuffling index, adjusting based on win/discard statistics */
export function getCardIndex(
  card: DeckCard,
  rng: IRNG,
  settings: LobbySettings,
): number {
  const base = rng.randomInt();
  let result = base;

  // Adjust index based on rating:
  if (settings.sort_cards_by_rating) {
    let factor =
      ((100.0 + card.rating * 40.0) / 100.0) *
      // (card.plays / 2.0 + 1.0) *
      (1.0 / (card.views / 10.0 + 1.0)) *
      (card.wins + 1.0) *
      (1.0 / (card.discards * 10.0 + 1.0));
    // Adjust prompt cards based on votes:
    if (card instanceof PromptDeckCard) {
      factor =
        factor *
        (2 * Math.max(0, card.upvotes - card.downvotes) + 1.0) *
        (1.0 / (Math.max(0, card.downvotes - card.upvotes) * 10.0 + 1.0));
    }
    // Adjust response cards based on likes:
    if (card instanceof ResponseDeckCard) {
      factor = factor * (1.0 + card.likes / 2.0);
    }
    factor = Math.max(0.0001, factor);
    factor = Math.min(factor, 1.0);
    result = (result * factor) >>> 0;
  }

  // Adjust index for unviewed cards
  if (settings.new_cards_first) {
    const half = 2000000000;
    // unviewed cards will go in 2^32 ~ 2^31, played cards in 2^31 ~ 0.
    if (card.views > 0) {
      result = result % half;
    } else {
      result = (result % half) + half;
    }
    // TODO: if all cards have been viewed by someone, then use cards that were
    // added after the player's last game.
  }

  // logger.debug(`Shuffle: base ${base} * factor ${factor} = ${result}`);
  return result;
}
