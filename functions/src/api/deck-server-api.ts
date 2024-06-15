import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase-server";
import {
  promptDeckCardConverter,
  responseDeckCardConverter,
} from "../shared/firestore-converters";
import { IRNG, RNG } from "../shared/rng";
import {
  CardInGame,
  DeckCard,
  GameLobby,
  GeneratedDeck,
  LobbySettings,
  PromptCardInGame,
  PromptDeckCard,
  ResponseCardInGame,
  ResponseDeckCard
} from "../shared/types";
import { getPlayerDataRef, getPlayerHand, getTurnsRef } from "./turn-server-api";

function getDeckPromptsRef(deckID: string) {
  return db.collection(`decks/${deckID}/prompts`)
    .withConverter(promptDeckCardConverter);
}

function getDeckResponsesRef(deckID: string) {
  return db.collection(`decks/${deckID}/responses`)
    .withConverter(responseDeckCardConverter);
}

/** Converts Prompt cards from a deck to a in-game Prompt cards. */
export async function getAllPromptsForGame(
  deckID: string, settings: LobbySettings,
): Promise<Array<PromptCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp("prompts");
  return (await getDeckPromptsRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new PromptCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      getCardIndex(card, rng, settings),
      card.content, card.pick, card.rating, card.tags);
    cardInLobby.deck_id = deckID;
    return cardInLobby;
  });
}

/** Converts Response cards from a deck to a in-game Response cards. */
export async function getAllResponsesForGame(
  deckID: string, settings: LobbySettings,
): Promise<Array<ResponseCardInGame>> {
  const rng = RNG.fromStrSeedWithTimestamp("responses");
  return (await getDeckResponsesRef(deckID).get()).docs.map((p) => {
    const card = p.data();
    const cardInLobby = new ResponseCardInGame(
      prefixID(deckID, card.id), deckID, card.id,
      getCardIndex(card, rng, settings),
      card.content, card.rating, false, card.tags);
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
  card: DeckCard, rng: IRNG, settings: LobbySettings,
): number {
  const base = rng.randomInt();
  let result = base;

  // Adjust index based on rating:
  if (settings.sort_cards_by_rating) {
    let factor = (100.0 + card.rating * 40.0) / 100.0 *
      // (card.plays / 2.0 + 1.0) *
      1.0 / (card.views / 10.0 + 1.0) *
      (card.wins + 1.0) *
      1.0 / (card.discards * 10.0 + 1.0);
    // Adjust prompt cards based on votes:
    if (card instanceof PromptDeckCard) {
      factor = factor *
        (2 * Math.max(0, card.upvotes - card.downvotes) + 1.0) *
        1.0 / (Math.max(0, card.downvotes - card.upvotes) * 10.0 + 1.0);
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
      result = result % half + half;
    }
    // TODO: if all cards have been viewed by someone, then use cards that were
    // added after the player's last game.
  }

  // logger.debug(`Shuffle: base ${base} * factor ${factor} = ${result}`);
  return result;
}

export interface LogData {
  viewedPrompts?: PromptCardInGame[],
  viewedResponses?: ResponseCardInGame[],
  playedPrompts?: PromptCardInGame[],
  playedResponses?: ResponseCardInGame[],
  discardedPrompts?: PromptCardInGame[],
  discardedResponses?: ResponseCardInGame[],
  wonResponses?: ResponseCardInGame[],
  // Cards that were liked multiple times will be added multiple times.
  likedResponses?: ResponseCardInGame[],
  promptVotes?: CardVoteData[],
}

export interface CardVoteData {
  card: CardInGame,
  upvotes: number,
  downvotes: number,
}

/**
 * Increments the "views" and "plays" counts on the given cards.
 * GameLobby is passed to validate settings: if it's a test game, don't log.
 * TODO: log interactions for `@@generated` cards too.
*/
export async function logCardInteractions(lobby: GameLobby, logData: LogData) {
  if (lobby.settings.freeze_stats) return;
  await db.runTransaction(async (transaction) => {
    for (const prompt of logData.viewedPrompts || []) {
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const prompt of logData.playedPrompts || []) {
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const prompt of logData.discardedPrompts || []) {
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.viewedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const response of logData.playedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const response of logData.discardedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.wonResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { wins: FieldValue.increment(1) });
    }
    for (const response of logData.likedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(response.card_id_in_deck);
      transaction.update(cardRef, { likes: FieldValue.increment(1) });
    }
    for (const promptVotes of logData.promptVotes || []) {
      const prompt = promptVotes.card;
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(prompt.card_id_in_deck);
      transaction.update(cardRef, { upvotes: FieldValue.increment(promptVotes.upvotes) });
      transaction.update(cardRef, { downvotes: FieldValue.increment(promptVotes.downvotes) });
    }
  });
}

/** Iterates through all turns and all player's cards, checks for downvotes,
 * and updates ratings on the card in deck. */
export async function logDownvotes(lobbyID: string) {
  const downvotedCards = new Array<ResponseCardInGame>();
  // get turn IDs without loading them:
  const turnSnaps = (await getTurnsRef(lobbyID).get()).docs;
  for (const turnSnap of turnSnaps) {
    const playerDataSnaps = (await getPlayerDataRef(lobbyID, turnSnap.id).get()).docs;
    for (const playerDataSnap of playerDataSnaps) {
      const hand = await getPlayerHand(lobbyID, turnSnap.id, playerDataSnap.id);
      for (const card of hand) {
        if (card.downvoted && !downvotedCards.find((c) => c.id === card.id)) {
          downvotedCards.push(card);
        }
      }
    }
  }
  await db.runTransaction(async (transaction) => {
    for (const card of downvotedCards) {
      if (card.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(card.deck_id).doc(card.card_id_in_deck);
      transaction.update(cardRef, { rating: FieldValue.increment(-1) });
    }
  });
}