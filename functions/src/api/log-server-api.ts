import * as logger from 'firebase-functions/logger';
import { assertExhaustive } from '../shared/utils';
import {
  getLobby,
  getOnlinePlayers,
  getPlayersRef,
} from './lobby-server-repository';
import {
  getAllPlayerResponses,
  getPlayerHand,
  getPromptVotes,
  getTurnPrompt,
} from './turn-server-repository';

import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase-server';
import {
  CardInGame,
  GameLobby,
  GameTurn,
  GeneratedDeck,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
} from '../shared/types';
import { getDeckPromptsRef, getDeckResponsesRef } from './deck-server-api';

export interface LogData {
  viewedPrompts?: PromptCardInGame[];
  viewedResponses?: ResponseCardInGame[];
  playedPrompts?: PromptCardInGame[];
  playedResponses?: ResponseCardInGame[];
  discardedPrompts?: PromptCardInGame[];
  discardedResponses?: ResponseCardInGame[];
  wonResponses?: ResponseCardInGame[];
  // Cards that were liked multiple times will be added multiple times.
  likedResponses?: ResponseCardInGame[];
  promptVotes?: CardVoteData[];
}

export interface CardVoteData {
  card: CardInGame;
  upvotes: number;
  downvotes: number;
}

/** Log interaction for the played prompt. */
export async function logPlayedPrompt(lobbyID: string, turn: GameTurn) {
  const prompt = await getTurnPrompt(lobbyID, turn);
  if (!prompt) {
    logger.warn(
      `Answering phase without a prompt. Lobby ${lobbyID} turn ${turn.id}`,
    );
    return;
  }
  const lobby = await getLobby(lobbyID);
  await logCardInteractions(lobby, {
    viewedPrompts: [prompt],
    playedPrompts: [prompt],
  });
}

/**
 * Log interactions from the turn in the "reading" phase:
 * - viewed hand
 * - played responses
 * Does not log discards, these are logged immediately.
 */
export async function logInteractionsInReadingPhase(
  lobbyID: string,
  turn: GameTurn,
) {
  const lobby = await getLobby(lobbyID);
  // Played cards:
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  const playedResponses = responses.reduce((array, resp) => {
    array.push(...resp.cards);
    return array;
  }, new Array<ResponseCardInGame>());
  // Discarded cards:
  const onlinePlayers = await getOnlinePlayers(lobbyID);
  const viewedResponses = new Array<ResponseCardInGame>();
  for (const player of onlinePlayers) {
    if (player.uid === turn.judge_uid) {
      // Skip judge, they didn't see their hand:
      continue;
    }
    const hand = await getPlayerHand(lobbyID, player.uid);
    viewedResponses.push(...hand);
  }
  await logCardInteractions(lobby, {
    viewedResponses,
    playedResponses,
  });
}

/**
 * Log interactions from the turn in the "complete" phase:
 * - winning response
 * - liked responses
 * - upvoted / downvoted prompt
 */
export async function logInteractionsInCompletePhase(
  lobbyID: string,
  turn: GameTurn,
  responses: PlayerResponse[],
) {
  const lobby = await getLobby(lobbyID);
  const winnerResponse = responses.find(
    (r) => r.player_uid === turn.winner_uid,
  );
  const wonResponses = winnerResponse?.cards;
  // Cards that were liked multiple times will be added multiple times.
  const likedResponses = new Array<ResponseCardInGame>();
  for (const response of responses) {
    if (response.like_count !== undefined) {
      for (let i = 0; i < response.like_count; i++) {
        likedResponses.push(...response.cards);
      }
    }
  }
  // Prompt votes:
  const promptVotes = [];
  const prompt = await getTurnPrompt(lobbyID, turn);
  if (prompt) {
    const voteData = { card: prompt, upvotes: 0, downvotes: 0 };
    const votes = await getPromptVotes(lobbyID, turn.id, prompt.id);
    for (const vote of votes) {
      switch (vote.choice) {
        case 'yes':
          voteData.upvotes++;
          break;
        case 'no':
          voteData.downvotes++;
          break;
        default:
          assertExhaustive(vote.choice);
      }
      if (vote.choice === 'yes') voteData.upvotes++;
      if (vote.choice === 'no') voteData.downvotes++;
    }
    promptVotes.push(voteData);
  }
  await logCardInteractions(lobby, {
    wonResponses,
    likedResponses,
    promptVotes,
  });
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
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(
        prompt.card_id_in_deck,
      );
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const prompt of logData.playedPrompts || []) {
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(
        prompt.card_id_in_deck,
      );
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const prompt of logData.discardedPrompts || []) {
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(
        prompt.card_id_in_deck,
      );
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.viewedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(
        response.card_id_in_deck,
      );
      transaction.update(cardRef, { views: FieldValue.increment(1) });
    }
    for (const response of logData.playedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(
        response.card_id_in_deck,
      );
      transaction.update(cardRef, { plays: FieldValue.increment(1) });
    }
    for (const response of logData.discardedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(
        response.card_id_in_deck,
      );
      transaction.update(cardRef, { discards: FieldValue.increment(1) });
    }
    for (const response of logData.wonResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(
        response.card_id_in_deck,
      );
      transaction.update(cardRef, { wins: FieldValue.increment(1) });
    }
    for (const response of logData.likedResponses || []) {
      if (response.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(response.deck_id).doc(
        response.card_id_in_deck,
      );
      transaction.update(cardRef, { likes: FieldValue.increment(1) });
    }
    for (const promptVotes of logData.promptVotes || []) {
      const prompt = promptVotes.card;
      if (prompt.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckPromptsRef(prompt.deck_id).doc(
        prompt.card_id_in_deck,
      );
      transaction.update(cardRef, {
        upvotes: FieldValue.increment(promptVotes.upvotes),
      });
      transaction.update(cardRef, {
        downvotes: FieldValue.increment(promptVotes.downvotes),
      });
    }
  });
}

/** Iterates through all turns and all player's cards, checks for downvotes,
 * and updates ratings on the card in deck. */
export async function logDownvotes(lobbyID: string) {
  const downvotedCards = new Array<ResponseCardInGame>();
  // get player IDs without loading them:
  const playerSnaps = (await getPlayersRef(lobbyID).get()).docs;
  for (const playerSnap of playerSnaps) {
    const hand = await getPlayerHand(lobbyID, playerSnap.id);
    for (const card of hand) {
      if (card.downvoted && !downvotedCards.find((c) => c.id === card.id)) {
        downvotedCards.push(card);
      }
    }
  }
  await db.runTransaction(async (transaction) => {
    for (const card of downvotedCards) {
      if (card.deck_id === GeneratedDeck.id) continue;
      const cardRef = getDeckResponsesRef(card.deck_id).doc(
        card.card_id_in_deck,
      );
      transaction.update(cardRef, { rating: FieldValue.increment(-1) });
    }
  });
}
