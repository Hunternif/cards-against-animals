// Server APIs for game turns, when the game is in progress.

import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../firebase-server';
import {
  promptCardInGameConverter,
  responseCardInGameConverter,
} from '../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  ResponseCardInHand,
} from '../shared/types';
import { assertExhaustive } from '../shared/utils';
import {
  findNextPlayer,
  getLobby,
  getPlayerSequence,
  getPlayerThrows,
  getPlayers,
  updateLobby,
  updatePlayer,
} from './lobby-server-api';
import {
  getLastTurn,
  getNewPlayerDiscard,
  getPlayerDataRef,
  getPlayerDiscard,
  getPlayerHand,
  getPlayerHandRef,
  getPlayerResponse,
  getResponseLikeCount,
  getTurn,
  getTurnsRef,
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
  const promptsRef = db
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
  const player = await getPlayerThrows(lobby.id, userID);
  const newDiscard = await getNewPlayerDiscard(lobby.id, turn.id, userID);
  if (!(await payDiscardCost(lobby.id, turn, player, newDiscard))) {
    return;
  }
  logger.info(`Discarding ${newDiscard.length} cards from player ${userID}`);
  // This will both remove discarded cards and deal new cards:
  await dealCardsToPlayer(lobby, turn, turn, userID);
}

/**
 * Deal cards to a given player, up to the limit.
 * Also removes discarded cards from the hand.
 * @param lastTurn will be used to check player's current turn and discard.
 * @param newTurn new cards will be added to this turn.
 */
export async function dealCardsToPlayer(
  lobby: GameLobby,
  lastTurn: GameTurn | null,
  newTurn: GameTurn,
  userID: string,
) {
  const deckResponsesRef = db
    .collection(`lobbies/${lobby.id}/deck_responses`)
    .withConverter(responseCardInGameConverter);
  const player = await getPlayerThrows(lobby.id, userID);
  const newPlayerData = new PlayerDataInTurn(userID, player.name);
  const handToDiscard = new Array<ResponseCardInGame>();
  const isNewTurn = lastTurn?.id !== newTurn.id;
  if (lastTurn) {
    const lastResponse = await getPlayerResponse(lobby.id, lastTurn.id, userID);
    const lastDiscard = await getPlayerDiscard(lobby.id, lastTurn.id, userID);
    const oldHand = await getPlayerHand(lobby.id, lastTurn.id, userID);
    for (const oldCard of oldHand) {
      if (lastDiscard.find((c) => c.id === oldCard.id)) {
        // discard cards that are still in the hand:
        handToDiscard.push(oldCard);
      } else if (
        isNewTurn &&
        lastResponse?.cards?.find((c) => c.id === oldCard.id)
      ) {
        // if starting a new turn, filter out submitted cards;
        // if it's the same turn, keep them.
      } else {
        // copy old cards to the new hand.
        // temporarily write them here, then upload it as a subcollection
        newPlayerData.hand.push(oldCard);
      }
    }
  }
  // Find how many more cards we need:
  const cardsPerPerson = lobby.settings.cards_per_person;
  const totalCardsNeeded = Math.max(
    0,
    cardsPerPerson - newPlayerData.hand.length,
  );

  // Fetch new cards:
  const dealTime = new Date();
  const newCards =
    totalCardsNeeded <= 0
      ? []
      : (
          await deckResponsesRef
            .orderBy('random_index', 'desc')
            .limit(totalCardsNeeded)
            .get()
        ).docs.map((c) => ResponseCardInHand.create(c.data(), new Date()));
  // Add cards to the new player hand
  newPlayerData.hand.push(...newCards);
  // If we ran out of cards, sorry!
  if (newCards.length > 0) {
    player.time_dealt_cards = dealTime;
    await updatePlayer(lobby.id, player);
  }

  // Remove dealt cards from the deck and upload player data & hand:
  const playerDataRef = getPlayerDataRef(lobby.id, newTurn.id);
  const handRef = getPlayerHandRef(lobby.id, newTurn.id, userID);
  await db.runTransaction(async (transaction) => {
    for (const card of newCards) {
      transaction.delete(deckResponsesRef.doc(card.id));
    }
    if (isNewTurn) {
      transaction.set(playerDataRef.doc(userID), newPlayerData);
    }
    for (const card of handToDiscard) {
      transaction.delete(handRef.doc(card.id));
    }
  });
  // Firebase Bug?? Doing it in 1 transaction is not atomic.
  // See https://stackoverflow.com/questions/78523307
  await db.runTransaction(async (transaction) => {
    for (const card of newPlayerData.hand) {
      transaction.set(handRef.doc(card.id), card);
    }
  });
  logger.info(`Dealt ${newCards.length} cards to player ${userID}`);
}

/** Updates all player's scores and likes from this turn, if it has ended. */
export async function updatePlayerScoresFromTurn(
  lobbyID: string,
  turn: GameTurn,
  responses: PlayerResponse[],
) {
  const players = await getPlayers(lobbyID, 'player');
  for (const player of players) {
    if (turn.winner_uid === player.uid) {
      player.score++;
      player.wins++;
    }
    const response = responses.find((r) => r.player_uid === player.uid);
    if (response) {
      const likeCount = await getResponseLikeCount(
        lobbyID,
        turn.id,
        player.uid,
      );
      response.like_count = likeCount;
      player.likes += likeCount;
      await updatePlayerResponse(lobbyID, turn.id, response);
    }
    await updatePlayer(lobbyID, player);
  }
}

/**
 * Updates the player's score ONE TIME, based on cards they discarded.
 * If a player discards multiple times during a turn, this needs to be called
 * multiple times.
 * @return true if the pay is accepted and discarding should proceed.
 */
async function payDiscardCost(
  lobbyID: string,
  turn: GameTurn,
  player: PlayerInLobby,
  discard: ResponseCardInGame[],
): Promise<boolean> {
  if (discard.length > 0) {
    player.discards_used++;
    // Check discard cost:
    const lobby = await getLobby(lobbyID);
    let actualCost = 0;
    switch (lobby.settings.discard_cost) {
      case 'free':
        break;
      case 'no_discard':
        break;
      case '1_star':
        actualCost = 1;
        break;
      case '1_free_then_1_star':
        actualCost = player.discards_used <= 1 ? 0 : 1;
        break;
      default:
        assertExhaustive(lobby.settings.discard_cost);
    }
    if (actualCost > 0 && player.score > 0) {
      player.score -= actualCost;
    }
    await updatePlayer(lobbyID, player);
    return true;
  }
  return false;
}
