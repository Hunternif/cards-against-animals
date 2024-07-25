// Server APIs for game turns, when the game is in progress.

import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from '../firebase-server';
import { promptCardInGameConverter } from '../shared/firestore-converters';
import { RNG } from '../shared/rng';
import {
  DiscardCost,
  GameLobby,
  GameTurn,
  PlayerGameState,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  ResponseCardInHand,
  anyTagsKey,
  noTagsKey,
} from '../shared/types';
import { assertExhaustive, countEveryN } from '../shared/utils';
import { findNextPlayer, getPlayerSequence } from './lobby-server-api';
import {
  getLobbyDeckResponsesRef,
  getOrCreatePlayerState,
  getPlayerStates,
  getPlayerThrows,
  getPlayers,
  updateLobby,
  updatePlayerState
} from './lobby-server-repository';
import { logCardInteractions } from './log-server-api';
import {
  getLastTurn,
  getNewPlayerDiscard,
  getPlayerDiscard,
  getPlayerHand,
  getPlayerResponse,
  getResponseLikeCount,
  getTurn,
  getTurnPromptsRef,
  getTurnsRef,
  setPlayerResponse,
  updatePlayerResponse,
  updateTurn,
} from './turn-server-repository';

/**
 * Creates a new turn without a prompt, and returns it.
 */
export async function createNewTurn(lobby: GameLobby): Promise<GameTurn> {
  // TODO: use transaction to ensure only one turn is created.
  const lastTurn = await getLastTurn(lobby);
  // Allow players to start a new turn whenever:
  // if (lastTurn && lastTurn.phase != "complete") {
  //   throw new HttpsError("failed-precondition",
  //     `Last turn has not completed in lobby ${lobbyID}`);
  // }
  const judge = await selectJudge(lobby.id, lastTurn);
  const newOrdinal = lastTurn ? lastTurn.ordinal + 1 : 1;
  const id = 'turn_' + String(newOrdinal).padStart(2, '0');
  if (!judge) {
    throw new HttpsError(
      'failed-precondition',
      `No more players in lobby ${lobby.id}`,
    );
  }
  const newTurn = new GameTurn(id, newOrdinal, judge.uid);
  await getTurnsRef(lobby.id).doc(id).set(newTurn);
  await dealCards(lobby, lastTurn, newTurn);
  lobby.current_turn_id = newTurn.id;
  await updateLobby(lobby);
  return newTurn; // timestamp may not have reloaded but that's ok.
}

/**
 * Starts the turn and returns it.
 */
export async function startTurn(
  lobbyID: string,
  turnID: string,
): Promise<GameTurn> {
  const turn = await getTurn(lobbyID, turnID);
  turn.phase = 'answering';
  await updateTurn(lobbyID, turn);
  return turn;
}

/** Returns the player who will judge the next turn. */
async function selectJudge(
  lobbyID: string,
  lastTurn: GameTurn | null,
): Promise<PlayerInLobby | null> {
  const sequence = await getPlayerSequence(lobbyID);
  return findNextPlayer(sequence, lastTurn?.judge_uid);
}

/** Selects a new prompt card from the remaining deck. */
async function selectPrompt(lobbyID: string): Promise<PromptCardInGame> {
  const promptsRef = firestore
    .collection(`lobbies/${lobbyID}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const cards = (
    await promptsRef.orderBy('random_index').limit(1).get()
  ).docs.map((c) => c.data());
  if (cards.length === 0) {
    throw new HttpsError('failed-precondition', 'No more cards in deck');
  }
  const selected = cards[0];
  // Remove selected card from the remaining deck:
  await promptsRef.doc(selected.id).delete();
  return selected;
}

/** (Only used in tests) */
export async function playPrompt(
  lobby: GameLobby,
  turn: GameTurn,
  card: PromptCardInGame,
) {
  await getTurnPromptsRef(lobby.id, turn.id).doc(card.id).set(card);
  turn.phase = 'answering';
  await updateTurn(lobby.id, turn);
}

/** (Only used in tests) */
export async function playResponse(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  cards: ResponseCardInGame[],
): Promise<PlayerResponse> {
  const rng = RNG.fromTimestamp();
  const player = await getPlayerThrows(lobby.id, userID);
  const response = new PlayerResponse(
    userID,
    player.name,
    cards,
    rng.randomInt(),
    0,
    0,
  );
  await setPlayerResponse(lobby.id, turn.id, response);
  return response;
}

/** Deal cards to all players. */
async function dealCards(
  lobby: GameLobby,
  lastTurn: GameTurn | null,
  newTurn: GameTurn,
): Promise<void> {
  // Deal cards to: online players, players who left.
  const players = (await getPlayers(lobby.id)).filter(
    (p) => p.role === 'player' && p.status !== 'banned',
  );
  players.sort((a, b) => a.random_index - b.random_index);
  for (const player of players) {
    await dealCardsToPlayer(lobby, lastTurn, newTurn, player.uid);
  }
}

/** Immediately remove discarded cards and deal new ones. */
export async function discardNowAndDealCardsToPlayer(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
) {
  // 1. Pay discard cost;
  // 2. Remove discarded cards from hand;
  // 3. Deal new cards.
  const player = await getOrCreatePlayerState(lobby, userID);
  const newDiscard = await getNewPlayerDiscard(lobby.id, player);
  if (newDiscard.length === 0 || !(await payDiscardCost(lobby, player))) {
    return;
  }
  logger.info(`Discarding ${newDiscard.length} cards from player ${userID}`);
  // This will both remove discarded cards and deal new cards:
  await dealCardsToPlayer(lobby, turn, turn, userID);
  // Log discarded cards:
  await logCardInteractions(lobby, {
    discardedResponses: newDiscard,
  });
}

/**
 * Deal cards to a given player, up to the limit.
 * Also removes discarded cards from the hand.
 * Also updates card counts per tag.
 * @param lastTurn will be used to check player's current turn and discard.
 * @param newTurn new cards will be added to this turn.
 */
export async function dealCardsToPlayer(
  lobby: GameLobby,
  lastTurn: GameTurn | null,
  newTurn: GameTurn,
  userID: string,
) {
  const deckResponsesRef = getLobbyDeckResponsesRef(lobby.id);
  const player = await getOrCreatePlayerState(lobby, userID);
  const newHand = new Array<ResponseCardInHand>();
  const oldHand = await getPlayerHand(lobby.id, player);
  const handToDiscard = new Array<ResponseCardInGame>();
  const isNewTurn = lastTurn?.id !== newTurn.id;
  const lastResponse =
    lastTurn == null
      ? []
      : (await getPlayerResponse(lobby.id, lastTurn.id, userID))?.cards ?? [];
  // TODO: optimize this, remove discards outside of this function.
  // TODO: maybe store all pool of discarded cards in a game somewhere.
  const lastDiscard = await getPlayerDiscard(lobby.id, player);
  for (const oldCard of oldHand) {
    if (lastDiscard.find((c) => c.id === oldCard.id)) {
      // discard cards that are still in the hand:
      handToDiscard.push(oldCard);
    } else if (isNewTurn && lastResponse.find((c) => c.id === oldCard.id)) {
      // if starting a new turn, filter out submitted cards;
      // if it's the same turn, keep them.
      handToDiscard.push(oldCard);
    } else {
      // copy old cards to the new hand.
      // temporarily write them here, then upload it as a subcollection
      newHand.push(oldCard);
    }
  }
  // Find how many more cards we need:
  const cardsPerPerson = lobby.settings.cards_per_person;
  const totalCardsNeeded = Math.max(0, cardsPerPerson - newHand.length);
  logger.info(
    `Trying to deal ${totalCardsNeeded} cards to player ${userID}...`,
  );

  await firestore.runTransaction(async (transaction) => {
    // Fetch new cards:
    const dealTime = new Date();
    const newCards =
      totalCardsNeeded <= 0
        ? []
        : (
            await transaction.get(
              deckResponsesRef
                .orderBy('random_index', 'desc')
                .limit(totalCardsNeeded),
            )
          ).docs.map((c) => ResponseCardInHand.create(c.data(), new Date()));
    // Update card counts per tag:
    for (const card of newCards) {
      lobby.response_tags.get(anyTagsKey)!.card_count -= 1;
      if (card.tags.length === 0) {
        lobby.response_tags.get(noTagsKey)!.card_count -= 1;
      }
      for (const tagName of card.tags) {
        const tagData = lobby.response_tags.get(tagName);
        if (tagData != null) {
          tagData.card_count -= 1;
        }
      }
    }
    await updateLobby(lobby, transaction);
    // Add cards to the new player hand
    newHand.push(...newCards);
    player.hand = new Map(newHand.map((c) => [c.id, c]));
    // If we ran out of cards, sorry!
    if (newCards.length > 0) {
      player.time_dealt_cards = dealTime;
    }
    // Remove dealt cards from the deck and upload player data & hand:
    for (const card of newCards) {
      transaction.delete(deckResponsesRef.doc(card.id));
    }
    await updatePlayerState(lobby.id, player, transaction);
    logger.info(`Dealt ${newCards.length} cards to player ${userID}`);
  });
}

/** Updates all player's scores and likes from this turn, if it has ended. */
export async function updatePlayerScoresFromTurn(
  lobbyID: string,
  turn: GameTurn,
  responses: PlayerResponse[],
) {
  const players = await getPlayerStates(lobbyID);
  for (const player of players) {
    if (turn.winner_uid === player.uid) {
      player.score++;
      player.wins++;
      player.discard_tokens++;
    }
    const response = responses.find((r) => r.player_uid === player.uid);
    if (response) {
      const likeCount = await getResponseLikeCount(
        lobbyID,
        turn.id,
        player.uid,
      );
      response.like_count = likeCount;
      // Discard tokens are awarded every 5 likes:
      player.discard_tokens += countEveryN(
        player.likes,
        player.likes + likeCount,
        5,
      );
      player.likes += likeCount;
      await updatePlayerResponse(lobbyID, turn.id, response);
    }
    // Discard tokens are also awarded every 5 turns:
    player.discard_tokens += countEveryN(turn.ordinal, turn.ordinal + 1, 5);
    await updatePlayerState(lobbyID, player);
  }
}

/**
 * Updates the player's score ONE TIME, based on cards they discarded.
 * If a player discards multiple times during a turn, this needs to be called
 * multiple times.
 * @return true if the pay is accepted and discarding should proceed.
 */
export async function payDiscardCost(
  lobby: GameLobby,
  player: PlayerGameState,
): Promise<boolean> {
  // Check discard cost:
  if (await calculateAndPayDiscardCost(lobby.settings.discard_cost, player)) {
    player.discards_used++;
    await updatePlayerState(lobby.id, player);
    return true;
  }
  return false;
}

/**
 * Modifies player state, subtracting the cost.
 * @return true if the pay is accepted and discarding should proceed.
 */
async function calculateAndPayDiscardCost(
  cost: DiscardCost,
  player: PlayerGameState,
) {
  switch (cost) {
    case 'free':
      return true;
    case 'no_discard':
      return false;
    case '1_star':
      if (player.score > 0) {
        player.score -= 1;
      }
      // For 'star' cost, allow discarding indefinitely:
      return true;
    case '1_free_then_1_star':
      if (player.discards_used >= 1 && player.score > 0) {
        player.score -= 1;
      }
      // For 'star' cost, allow discarding indefinitely:
      return true;
    case 'token':
      if (player.discard_tokens > 0) {
        player.discard_tokens -= 1;
        return true;
      }
      return false;
    default:
      assertExhaustive(cost);
      return false;
  }
}
