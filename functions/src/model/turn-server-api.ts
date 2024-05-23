// Server APIs for game turns, when the game is in progress.

import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../firebase-server";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  responseCardInHandConverter,
  turnConverter,
  voteConverter
} from "../shared/firestore-converters";
import {
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  ResponseCardInHand,
  Vote
} from "../shared/types";
import { logCardInteractions } from "./deck-server-api";
import {
  findNextPlayer,
  getLobby,
  getPlayerSequence,
  getPlayerThrows,
  getPlayers,
  updateLobby,
  updatePlayer
} from "./lobby-server-api";

/** Returns Firestore subcollection reference. */
export function getTurnsRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/turns`).withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
function getTurnPromptsRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/prompts`)
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
export function getPlayerDataRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data`)
    .withConverter(playerDataConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerHandRef(lobbyID: string, turnID: string, userID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/hand`)
    .withConverter(responseCardInHandConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses`)
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerDiscardRef(lobbyID: string, turnID: string, userID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/discarded`)
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
function getResponseLikesRef(lobbyID: string, turnID: string, userID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses/${userID}/likes`)
    .withConverter(voteConverter);
}

/** Returns Firestore subcollection reference of votes for a prompt in turn. */
function getPromptVotesRef(lobbyID: string, turnID: string, promptCardID: string) {
  return db.collection(`lobbies/${lobbyID}/turns/${turnID}/prompts/${promptCardID}/votes`)
    .withConverter(voteConverter);
}

/** Returns all turns that occurred in this lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getTurnsRef(lobbyID).get()).docs.map((t) => t.data());
}

/** Finds turn by ID, or throws HttpsError. */
export async function getTurn(lobbyID: string, turnID: string):
  Promise<GameTurn> {
  const turn = (await getTurnsRef(lobbyID).doc(turnID).get()).data();
  if (!turn) throw new HttpsError("not-found", `Turn ${turnID} not found in lobby ${lobbyID}`);
  return turn;
}

/** Finds the last turn in the lobby. */
export async function getLastTurn(lobby: GameLobby): Promise<GameTurn | null> {
  return lobby.current_turn_id ?
    await getTurn(lobby.id, lobby.current_turn_id) : null;
}

/**
 * Updates turn state in Firestore.
 * Does not update subcollections! (player_data, player_resposnes etc)
 */
export async function updateTurn(lobbyID: string, turn: GameTurn): Promise<void> {
  await getTurnsRef(lobbyID).doc(turn.id)
    .update(turnConverter.toFirestore(turn));
}

/** Counts how many turns have occurred in this lobby. */
export async function countTurns(lobbyID: string): Promise<number> {
  return (await getTurnsRef(lobbyID).count().get()).data().count;
}

/** Get the played prompt for the current turn. */
export async function getTurnPrompt(lobbyID: string, turn: GameTurn):
  Promise<PromptCardInGame | null> {
  // Check legacy prompt:
  if (turn.legacy_prompt) return turn.legacy_prompt;
  // Get the first prompt from the subcollection:
  const promptDocs = (await getTurnPromptsRef(lobbyID, turn.id).get()).docs;
  if (promptDocs.length === 0) return null;
  return promptDocs[0].data();
}

/** Data from a specific player, from a specific turn. */
export async function getPlayerData(
  lobbyID: string, turnID: string, uid: string
): Promise<PlayerDataInTurn | null> {
  return (await getPlayerDataRef(lobbyID, turnID).doc(uid).get()).data() ?? null;
}

/** Data from all players, from a specific turn. */
export async function getAllPlayerData(lobbyID: string, turnID: string):
  Promise<PlayerDataInTurn[]> {
  return (await getPlayerDataRef(lobbyID, turnID).get())
    .docs.map((d) => d.data());
}

/** Hand from a specific player, from a specific turn. */
export async function getPlayerHand(
  lobbyID: string, turnID: string, uid: string
): Promise<ResponseCardInHand[]> {
  return (await getPlayerHandRef(lobbyID, turnID, uid).get())
    .docs.map((t) => t.data());
}

/** ALL discarded cards from a specific player, from a specific turn. */
export async function getPlayerDiscard(
  lobbyID: string, turnID: string, uid: string
): Promise<ResponseCardInGame[]> {
  return (await getPlayerDiscardRef(lobbyID, turnID, uid).get())
    .docs.map((t) => t.data());
}

/** NEW discarded cards from a specific player, from a specific turn.
 * Excludes cards that were discarded during previous "discard" moves. */
export async function getNewPlayerDiscard(
  lobbyID: string, turnID: string, uid: string
): Promise<ResponseCardInGame[]> {
  const discardDocs = (await getPlayerDiscardRef(lobbyID, turnID, uid).get()).docs;
  const handDocs = (await getPlayerHandRef(lobbyID, turnID, uid).get()).docs;
  // Filter out cards that were removed from hand, during previous discards:
  return discardDocs
    .filter((d) => handDocs.findIndex((h) => h.id === d.id) > -1)
    .map((t) => t.data());
}

/** Responses from all players in this turn. */
export async function getPlayerResponse(
  lobbyID: string, turnID: string, userID: string
): Promise<PlayerResponse | null> {
  return (await getPlayerResponsesRef(lobbyID, turnID).doc(userID).get())
    .data() ?? null;
}

/** Responses from all players in this turn. */
export async function getAllPlayerResponses(lobbyID: string, turnID: string):
  Promise<Array<PlayerResponse>> {
  return (await getPlayerResponsesRef(lobbyID, turnID).get()).docs.map((t) => t.data());
}

/** Update response state in Firestore. */
export async function updatePlayerResponse(
  lobbyID: string, turnID: string, response: PlayerResponse,
) {
  await getPlayerResponsesRef(lobbyID, turnID).doc(response.player_uid)
    .update(playerResponseConverter.toFirestore(response));
}

/** How many likes this response has. */
export async function getResponseLikeCount(
  lobbyID: string, turnID: string, userID: string,
): Promise<number> {
  return (await getResponseLikesRef(lobbyID, turnID, userID).count().get()).data().count;
}

/** Get players' votes on this prompt. */
export async function getPromptVotes(
  lobbyID: string, turnID: string, cardID: string,
): Promise<Array<Vote>> {
  return (await getPromptVotesRef(lobbyID, turnID, cardID).get()).docs.map((t) => t.data());
}

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
  const newOrdinal = lastTurn ? (lastTurn.ordinal + 1) : 1;
  const id = "turn_" + String(newOrdinal).padStart(2, '0');
  if (!judge) {
    throw new HttpsError(
      "failed-precondition", `No more players in lobby ${lobby.id}`);
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
export async function startTurn(lobbyID: string, turnID: string): Promise<GameTurn> {
  const turn = await getTurn(lobbyID, turnID);
  turn.phase = "answering";
  await updateTurn(lobbyID, turn);
  return turn;
}

/** Returns the player who will judge the next turn. */
async function selectJudge(lobbyID: string, lastTurn: GameTurn | null):
  Promise<PlayerInLobby | null> {
  const sequence = await getPlayerSequence(lobbyID);
  return findNextPlayer(sequence, lastTurn?.judge_uid);
}

/** Selects a new prompt card from the remaining deck. */
async function selectPrompt(lobbyID: string): Promise<PromptCardInGame> {
  const promptsRef = db.collection(`lobbies/${lobbyID}/deck_prompts`)
    .withConverter(promptCardInGameConverter);
  const cards = (await promptsRef
    .orderBy("random_index")
    .limit(1).get()
  ).docs.map((c) => c.data());
  if (cards.length === 0) {
    throw new HttpsError("failed-precondition", "No more cards in deck");
  }
  const selected = cards[0];
  // Remove selected card from the remaining deck:
  await promptsRef.doc(selected.id).delete();
  return selected;
}

/** Deal cards to all players. */
async function dealCards(
  lobby: GameLobby, lastTurn: GameTurn | null, newTurn: GameTurn,
): Promise<void> {
  // Deal cards to: online players, players who left.
  const players = (await getPlayers(lobby.id))
    .filter((p) => p.role === "player" && p.status !== "kicked");
  for (const player of players) {
    await dealCardsToPlayer(lobby, lastTurn, newTurn, player.uid);
  }
}

/** Immediately remove discarded cards and deal new ones. */
export async function discardNowAndDealCardsToPlayer(
  lobby: GameLobby, turn: GameTurn, userID: string,
) {
  // 1. Pay discard cost;
  // 2. Remove discarded cards from hand;
  // 3. Deal new cards.
  const player = await getPlayerThrows(lobby.id, userID);
  const newDiscard = await getNewPlayerDiscard(lobby.id, turn.id, userID);
  if (!await payDiscardCost(lobby.id, turn, player, newDiscard)) {
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
  lobby: GameLobby, lastTurn: GameTurn | null, newTurn: GameTurn, userID: string,
) {
  const deckResponsesRef = db.collection(`lobbies/${lobby.id}/deck_responses`)
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
      } else if (isNewTurn && lastResponse?.cards?.find((c) => c.id === oldCard.id)) {
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
  const totalCardsNeeded = Math.max(0, cardsPerPerson - newPlayerData.hand.length);

  // Fetch new cards:
  const newCards = totalCardsNeeded <= 0 ? [] : (await deckResponsesRef
    .orderBy("random_index", "desc")
    .limit(totalCardsNeeded).get()
  ).docs.map((c) => ResponseCardInHand.create(c.data(), new Date()));
  // Add cards to the new player hand
  newPlayerData.hand.push(...newCards);
  // If we ran out of cards, sorry!

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
  lobbyID: string, turn: GameTurn, responses: PlayerResponse[],
) {
  const players = await getPlayers(lobbyID, "player");
  for (const player of players) {
    if (turn.winner_uid === player.uid) {
      player.score++;
      player.wins++;
    }
    const response = responses.find((r) => r.player_uid === player.uid);
    if (response) {
      const likeCount = await getResponseLikeCount(lobbyID, turn.id, player.uid);
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
  lobbyID: string, turn: GameTurn, player: PlayerInLobby,
  discard: ResponseCardInGame[],
): Promise<boolean> {
  if (discard.length > 0) {
    player.discards_used++;
    // Check discard cost:
    const lobby = await getLobby(lobbyID);
    const cost = lobby.settings.discard_cost;
    const isDiscardFree = cost === "free" ||
      cost === "1_free_then_1_star" && player.discards_used <= 1;
    if (!isDiscardFree && player.score > 0) {
      player.score--;
    }
    await updatePlayer(lobbyID, player);
    return true;
  }
  return false;
}

/** Log interaction for the played prompt. */
export async function logPlayedPrompt(lobbyID: string, turn: GameTurn) {
  const prompt = await getTurnPrompt(lobbyID, turn);
  if (!prompt) {
    logger.warn(`Answering phase without a prompt. Lobby ${lobbyID} turn ${turn.id}`);
    return;
  }
  const lobby = await getLobby(lobbyID);
  await logCardInteractions(lobby, { viewedPrompts: [prompt], playedPrompts: [prompt] });
}

/**
 * Log interactions from the turn in the "reading" phase:
 * - viewed hand
 * - played responses
 * - discards
 */
export async function logInteractionsInReadingPhase(
  lobbyID: string, turn: GameTurn,
) {
  const lobby = await getLobby(lobbyID);
  // Played cards:
  const responses = await getAllPlayerResponses(lobbyID, turn.id);
  const playedResponses = responses.reduce((array, resp) => {
    array.push(...resp.cards);
    return array;
  }, new Array<ResponseCardInGame>());
  // Discarded cards:
  const playerData = await getAllPlayerData(lobbyID, turn.id);
  const discardedResponses = new Array<ResponseCardInGame>();
  const viewedResponses = new Array<ResponseCardInGame>();
  for (const pData of playerData) {
    if (pData.player_uid === turn.judge_uid) {
      // Skip judge, they didn't see their hand:
      continue;
    }
    const hand = await getPlayerHand(lobbyID, turn.id, pData.player_uid);
    viewedResponses.push(...hand);
    const discarded = await getPlayerDiscard(lobbyID, turn.id, pData.player_uid);
    discardedResponses.push(...discarded);
  }
  await logCardInteractions(lobby, { viewedResponses, playedResponses, discardedResponses });
}

/**
 * Log interactions from the turn in the "complete" phase:
 * - winning response
 * - liked responses
 * - upvoted / downvoted prompt
 */
export async function logInteractionsInCompletePhase(
  lobbyID: string, turn: GameTurn, responses: PlayerResponse[],
) {
  const lobby = await getLobby(lobbyID);
  const winnerResponse = responses.find((r) => r.player_uid === turn.winner_uid);
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
      if (vote.choice === "yes") voteData.upvotes++;
      if (vote.choice === "no") voteData.downvotes++;
    }
    promptVotes.push(voteData);
  }
  await logCardInteractions(lobby, { wonResponses, likedResponses, promptVotes });
}