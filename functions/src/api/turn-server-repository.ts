import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../firebase-server';
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  responseCardInHandConverter,
  turnConverter,
  voteConverter,
} from '../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  ResponseCardInHand,
  Vote,
} from '../shared/types';

///////////////////////////////////////////////////////////////////////////////
//
//  A game Lobby consists of many Turns.
//  This module containts methods to read and write Turn data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference. */
export function getTurnsRef(lobbyID: string) {
  return db.collection(`lobbies/${lobbyID}/turns`).withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
function getTurnPromptsRef(lobbyID: string, turnID: string) {
  return db
    .collection(`lobbies/${lobbyID}/turns/${turnID}/prompts`)
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
export function getPlayerDataRef(lobbyID: string, turnID: string) {
  return db
    .collection(`lobbies/${lobbyID}/turns/${turnID}/player_data`)
    .withConverter(playerDataConverter);
}

/** Returns Firestore subcollection reference. */
export function getPlayerHandRef(
  lobbyID: string,
  turnID: string,
  userID: string,
) {
  return db
    .collection(`lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/hand`)
    .withConverter(responseCardInHandConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return db
    .collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses`)
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerDiscardRef(lobbyID: string, turnID: string, userID: string) {
  return db
    .collection(
      `lobbies/${lobbyID}/turns/${turnID}/player_data/${userID}/discarded`,
    )
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
function getResponseLikesRef(lobbyID: string, turnID: string, userID: string) {
  return db
    .collection(
      `lobbies/${lobbyID}/turns/${turnID}/player_responses/${userID}/likes`,
    )
    .withConverter(voteConverter);
}

/** Returns Firestore subcollection reference of votes for a prompt in turn. */
function getPromptVotesRef(
  lobbyID: string,
  turnID: string,
  promptCardID: string,
) {
  return db
    .collection(
      `lobbies/${lobbyID}/turns/${turnID}/prompts/${promptCardID}/votes`,
    )
    .withConverter(voteConverter);
}

/** Returns all turns that occurred in this lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getTurnsRef(lobbyID).get()).docs.map((t) => t.data());
}

/** Finds turn by ID, or throws HttpsError. */
export async function getTurn(
  lobbyID: string,
  turnID: string,
): Promise<GameTurn> {
  const turn = (await getTurnsRef(lobbyID).doc(turnID).get()).data();
  if (!turn) {
    throw new HttpsError(
      'not-found',
      `Turn ${turnID} not found in lobby ${lobbyID}`,
    );
  }
  return turn;
}

/** Finds the last turn in the lobby. */
export async function getLastTurn(lobby: GameLobby): Promise<GameTurn | null> {
  return lobby.current_turn_id
    ? await getTurn(lobby.id, lobby.current_turn_id)
    : null;
}

/**
 * Updates turn state in Firestore.
 * Does not update subcollections! (player_data, player_resposnes etc)
 */
export async function updateTurn(
  lobbyID: string,
  turn: GameTurn,
): Promise<void> {
  await getTurnsRef(lobbyID)
    .doc(turn.id)
    .update(turnConverter.toFirestore(turn));
}

/** Counts how many turns have occurred in this lobby. */
export async function countTurns(lobbyID: string): Promise<number> {
  return (await getTurnsRef(lobbyID).count().get()).data().count;
}

/** Get the played prompt for the current turn. */
export async function getTurnPrompt(
  lobbyID: string,
  turn: GameTurn,
): Promise<PromptCardInGame | null> {
  // Check legacy prompt:
  if (turn.legacy_prompt) return turn.legacy_prompt;
  // Get the first prompt from the subcollection:
  const promptDocs = (await getTurnPromptsRef(lobbyID, turn.id).get()).docs;
  if (promptDocs.length === 0) return null;
  return promptDocs[0].data();
}

/** Data from a specific player, from a specific turn. */
export async function getPlayerData(
  lobbyID: string,
  turnID: string,
  uid: string,
): Promise<PlayerDataInTurn | null> {
  return (
    (await getPlayerDataRef(lobbyID, turnID).doc(uid).get()).data() ?? null
  );
}

/** Data from all players, from a specific turn. */
export async function getAllPlayerData(
  lobbyID: string,
  turnID: string,
): Promise<PlayerDataInTurn[]> {
  return (await getPlayerDataRef(lobbyID, turnID).get()).docs.map((d) =>
    d.data(),
  );
}

/** Hand from a specific player, from a specific turn. */
export async function getPlayerHand(
  lobbyID: string,
  turnID: string,
  uid: string,
): Promise<ResponseCardInHand[]> {
  return (await getPlayerHandRef(lobbyID, turnID, uid).get()).docs.map((t) =>
    t.data(),
  );
}

/** ALL discarded cards from a specific player, from a specific turn. */
export async function getPlayerDiscard(
  lobbyID: string,
  turnID: string,
  uid: string,
): Promise<ResponseCardInGame[]> {
  return (await getPlayerDiscardRef(lobbyID, turnID, uid).get()).docs.map((t) =>
    t.data(),
  );
}

/** NEW discarded cards from a specific player, from a specific turn.
 * Excludes cards that were discarded during previous "discard" moves. */
export async function getNewPlayerDiscard(
  lobbyID: string,
  turnID: string,
  uid: string,
): Promise<ResponseCardInGame[]> {
  const discardDocs = (await getPlayerDiscardRef(lobbyID, turnID, uid).get())
    .docs;
  const handDocs = (await getPlayerHandRef(lobbyID, turnID, uid).get()).docs;
  // Filter out cards that were removed from hand, during previous discards:
  return discardDocs
    .filter((d) => handDocs.findIndex((h) => h.id === d.id) > -1)
    .map((t) => t.data());
}

/** Responses from all players in this turn. */
export async function getPlayerResponse(
  lobbyID: string,
  turnID: string,
  userID: string,
): Promise<PlayerResponse | null> {
  return (
    (await getPlayerResponsesRef(lobbyID, turnID).doc(userID).get()).data() ??
    null
  );
}

/** Responses from all players in this turn. */
export async function getAllPlayerResponses(
  lobbyID: string,
  turnID: string,
): Promise<Array<PlayerResponse>> {
  return (await getPlayerResponsesRef(lobbyID, turnID).get()).docs.map((t) =>
    t.data(),
  );
}

/** Update response state in Firestore. */
export async function updatePlayerResponse(
  lobbyID: string,
  turnID: string,
  response: PlayerResponse,
) {
  await getPlayerResponsesRef(lobbyID, turnID)
    .doc(response.player_uid)
    .update(playerResponseConverter.toFirestore(response));
}

/** How many likes this response has. */
export async function getResponseLikeCount(
  lobbyID: string,
  turnID: string,
  userID: string,
): Promise<number> {
  return (
    await getResponseLikesRef(lobbyID, turnID, userID).count().get()
  ).data().count;
}

/** Get players' votes on this prompt. */
export async function getPromptVotes(
  lobbyID: string,
  turnID: string,
  cardID: string,
): Promise<Array<Vote>> {
  return (await getPromptVotesRef(lobbyID, turnID, cardID).get()).docs.map(
    (t) => t.data(),
  );
}
