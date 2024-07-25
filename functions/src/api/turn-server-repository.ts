import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from '../firebase-server';
import {
  playerResponseConverter,
  promptCardInGameConverter,
  turnConverter,
  voteConverter,
} from '../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerGameState,
  PlayerInLobby,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame,
  ResponseCardInHand,
  Vote,
} from '../shared/types';
import { updatePlayerState } from './lobby-server-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  A game Lobby consists of many Turns.
//  This module containts methods to read and write Turn data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference. */
export function getTurnsRef(lobbyID: string) {
  return firestore
    .collection(`lobbies/${lobbyID}/turns`)
    .withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
export function getTurnPromptsRef(lobbyID: string, turnID: string) {
  return firestore
    .collection(`lobbies/${lobbyID}/turns/${turnID}/prompts`)
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return firestore
    .collection(`lobbies/${lobbyID}/turns/${turnID}/player_responses`)
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference. */
function getResponseLikesRef(lobbyID: string, turnID: string, userID: string) {
  return firestore
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
  return firestore
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
 * Does not update subcollections! (player_resposnes etc)
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

/** Hand from a specific player. */
export async function getPlayerHand(
  lobbyID: string,
  player: PlayerGameState,
): Promise<ResponseCardInHand[]> {
  return Array.from(player.hand.values());
}

/** ALL discarded cards from a specific player, in the last turn. */
export async function getPlayerDiscard(
  lobbyID: string,
  player: PlayerGameState,
): Promise<ResponseCardInGame[]> {
  return Array.from(player.discarded.values());
}

/** (Only used in tests) */
export async function addPlayerDiscard(
  lobbyID: string,
  player: PlayerGameState,
  cards: ResponseCardInGame[],
) {
  for (const card of cards) {
    player.discarded.set(card.id, card);
  }
  await updatePlayerState(lobbyID, player);
}

/** NEW discarded cards from a specific player.
 * Excludes cards that were discarded during previous "discard" moves. */
export async function getNewPlayerDiscard(
  lobbyID: string,
  player: PlayerGameState,
): Promise<ResponseCardInGame[]> {
  // Filter out cards that were removed from hand, during previous discards:
  const out = new Array<ResponseCardInGame>();
  const discard = await getPlayerDiscard(lobbyID, player);
  return discard.filter((card) => player.hand.has(card.id));
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

/** Creates response state in Firestore. */
export async function setPlayerResponse(
  lobbyID: string,
  turnID: string,
  response: PlayerResponse,
) {
  await getPlayerResponsesRef(lobbyID, turnID)
    .doc(response.player_uid)
    .set(response);
}

/** Updates response state in Firestore. */
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
