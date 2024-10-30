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
} from '../shared/types';
import { assertExhaustive, countEveryN } from '../shared/utils';
import { getDeckResponseCard } from './deck-server-api';
import { exchangeCards } from './exchange-cards-server-api';
import {
  addResponsesToLobby,
  findNextPlayer,
  getPlayerSequence,
} from './lobby-server-api';
import {
  countOnlinePlayers,
  getLobbyDeckResponsesRef,
  getOrCreatePlayerState,
  getPlayers,
  getPlayerState,
  getPlayerStates,
  getPlayerThrows,
  updateLobby,
  updatePlayerState,
} from './lobby-server-repository';
import {
  fetchCardsForTagsWithTransaction,
  updateTagCountsForDeal,
} from './lobby-tags-api';
import {
  getLastTurn,
  getNewPlayerDiscard,
  getPlayerDiscard,
  getPlayerResponse,
  getResponseLikeCount,
  getTurn,
  getTurnPromptsRef,
  getTurnsRef,
  makeTurnID,
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
  const id = makeTurnID(newOrdinal);
  if (!judge) {
    throw new HttpsError(
      'failed-precondition',
      `No more players in lobby ${lobby.id}`,
    );
  }
  const newTurn = new GameTurn(id, newOrdinal, judge.uid);
  await getTurnsRef(lobby.id).doc(id).set(newTurn);
  await dealCardsForNewTurn(lobby, lastTurn, newTurn);
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

/** Deal cards to all players.
 * Also removes any played or discarded cards. */
async function dealCardsForNewTurn(
  lobby: GameLobby,
  lastTurn: GameTurn | null,
  newTurn: GameTurn,
): Promise<void> {
  const playedCards = new Array<ResponseCardInGame>();
  const discardedCards = new Array<ResponseCardInGame>();
  const players = (await getPlayers(lobby.id)).filter(
    (p) => p.status !== 'banned',
  );
  players.sort((a, b) => a.random_index - b.random_index);
  const playerStates = new Map<string, PlayerGameState>();

  // 1. Remove cards from: all players (including temporary spectators).
  for (const player of players) {
    const playerState = await getPlayerState(lobby.id, player.uid);
    if (playerState) {
      playerStates.set(player.uid, playerState);
      if (lastTurn) {
        const played = await removePlayedCards(lobby, lastTurn, playerState);
        playedCards.push(...played);
      }
      const discarded = await removeDiscardedCards(lobby, playerState);
      discardedCards.push(...discarded);
      // These calls do not update the DB!
      // TODO: clean up this API.
    }
  }

  // 2. Reuse cards if needed:
  const rng = RNG.fromStrSeedWithTimestamp('reused');
  if (lobby.settings.reuse_played_cards) {
    // Reduce rank and add extra randomness:
    for (const card of playedCards) {
      card.random_index *= 0.01 + 0.1 * rng.randomFloat();
      // Reset content for actions cards:
      if (card.action) {
        const originalCard = await getDeckResponseCard(
          card.deck_id,
          card.card_id_in_deck,
        );
        if (originalCard) {
          card.content = originalCard.content;
        }
      }
    }
    await addResponsesToLobby(lobby, playedCards);
  }
  if (lobby.settings.reuse_discarded_cards) {
    // Reduce rank and add extra randomness:
    discardedCards.forEach((c) => {
      c.random_index *= 0.001 + 0.01 * rng.randomFloat();
    });
    await addResponsesToLobby(lobby, discardedCards);
  }

  // 3.  Finally deal cards to players:
  for (const player of players) {
    let playerState = playerStates.get(player.uid);
    if (player.role === 'player') {
      if (!playerState) {
        playerState = await getOrCreatePlayerState(lobby, player.uid);
      }
      // Deal cards to: online players, players who left, bots.
      const maxCards = player.is_bot
        ? lobby.settings.cards_per_bot
        : lobby.settings.cards_per_person;
      await dealCardsToPlayer(lobby, playerState, [], maxCards);
    } else if (playerState) {
      // Don't forget to update the DB:
      await updatePlayerState(lobby.id, playerState);
    }
  }
}

/** Immediately remove discarded cards and deal new ones. */
export async function discardNowAndDealCardsToPlayer(
  lobby: GameLobby,
  userID: string,
) {
  // 1. Pay discard cost;
  // 2. Remove discarded cards from hand;
  // 3. Deal new cards.
  const playerState = await getOrCreatePlayerState(lobby, userID);
  const newDiscard = await getNewPlayerDiscard(lobby.id, playerState);
  await exchangeCards(
    lobby,
    playerState,
    newDiscard.map((c) => c.id),
    [],
  );
}

/**
 * Removes discarded cards from the player's 'discarded' list.
 * Doesn't commit player state to the DB because following calls will do it.
 */
async function removeDiscardedCards(
  lobby: GameLobby,
  playerState: PlayerGameState,
): Promise<ResponseCardInGame[]> {
  const discard = await getPlayerDiscard(lobby.id, playerState);
  // TODO: maybe store all pool of discarded cards in a game somewhere.
  for (const card of discard) {
    playerState.discarded.delete(card.id);
  }
  return discard;
}

/**
 * Removes played cards from player responses.
 * Doesn't commit player state to the DB because following calls will do it.
 */
async function removePlayedCards(
  lobby: GameLobby,
  turn: GameTurn,
  playerState: PlayerGameState,
): Promise<ResponseCardInGame[]> {
  const response = await getPlayerResponse(lobby.id, turn.id, playerState.uid);
  if (response != null) {
    for (const card of response.cards) {
      playerState.hand.delete(card.id);
    }
  }
  return response?.cards ?? [];
}

/**
 * Deal cards to a given player, up to the limit.
 * Also removes discarded cards from the hand.
 * Also updates card counts per tag.
 * @param lastTurn will be used to check player's current turn and discard.
 * @param newTurn new cards will be added to this turn.
 * @param tagNames will attempt to deal cards with the requested tags.
 */
export async function dealCardsToPlayer(
  lobby: GameLobby,
  playerState: PlayerGameState,
  tagNames: string[] = [],
  cardsPerPerson: number = lobby.settings.cards_per_person,
) {
  const userID = playerState.uid;
  const deckResponsesRef = getLobbyDeckResponsesRef(lobby.id);
  // Find how many more cards we need:
  const totalCardsNeeded = Math.max(0, cardsPerPerson - playerState.hand.size);
  logger.info(
    `Trying to deal ${totalCardsNeeded} cards to player ${userID}...`,
  );

  await firestore.runTransaction(async (transaction) => {
    // Fetch new cards.
    // "Deal time" should be less than the time for the next card:
    const dealTime = new Date();
    const newCards = await fetchCardsForTagsWithTransaction(
      lobby.id,
      tagNames,
      totalCardsNeeded,
      transaction,
    );
    // Update card counts per tag:
    updateTagCountsForDeal(lobby, newCards);
    await updateLobby(lobby, transaction);
    // Add cards to the new player hand
    for (const card of newCards) {
      playerState.hand.set(card.id, card);
    }
    // If we ran out of cards, sorry!
    if (newCards.length > 0) {
      playerState.time_dealt_cards = dealTime;
    }
    // Remove dealt cards from the deck and upload player data & hand:
    for (const card of newCards) {
      transaction.delete(deckResponsesRef.doc(card.id));
    }
    await updatePlayerState(lobby.id, playerState, transaction);
    logger.info(`Dealt ${newCards.length} cards to player ${userID}`);
  });
}

/** Updates all player's scores and likes from this turn, if it has ended. */
export async function updatePlayerScoresFromTurn(
  lobby: GameLobby,
  turn: GameTurn,
  responses: PlayerResponse[],
) {
  const players = await getPlayerStates(lobby.id);
  const playerCount = await countOnlinePlayers(lobby.id, 'player');
  for (const player of players) {
    if (turn.winner_uid === player.uid) {
      player.score++;
      player.wins++;
      // player.discard_tokens++; // Do not award tokens for wins.
    }
    const response = responses.find((r) => r.player_uid === player.uid);
    if (response) {
      const likeCount = await getResponseLikeCount(
        lobby.id,
        turn.id,
        player.uid,
      );
      response.like_count = likeCount;
      // Discard tokens are awarded every [N/2] likes, where N = number of players
      player.discard_tokens += countEveryN(
        player.likes,
        player.likes + likeCount,
        Math.ceil(playerCount / 2),
      );
      player.likes += likeCount;
      await updatePlayerResponse(lobby.id, turn.id, response);
    }
    // Discard tokens are also awarded every N turns,
    // where N is based on player wins. (winners get less):
    // But not less often than the number of turns:
    const nTurns = Math.min(2 + player.wins, playerCount);
    player.discard_tokens += countEveryN(
      turn.ordinal,
      turn.ordinal + 1,
      nTurns,
    );
    // Limit max number of tokens:
    player.discard_tokens = Math.min(
      player.discard_tokens,
      lobby.settings.max_discard_tokens,
    );
    await updatePlayerState(lobby.id, player);
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
