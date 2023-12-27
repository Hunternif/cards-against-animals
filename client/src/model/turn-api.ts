// Client APIs for game turns, when the game is in progress.

import {
  collection, deleteDoc, doc,
  getCountFromServer,
  getDocs, limit, orderBy,
  query, runTransaction, setDoc, updateDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  useCollection,
  useCollectionData,
  useCollectionDataOnce,
  useDocumentData
} from "react-firebase-hooks/firestore";
import { db, lobbiesRef, newTurnFun } from "../firebase";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  responseCardInGameConverter,
  turnConverter
} from "../shared/firestore-converters";
import { RNG } from "../shared/rng";
import {
  GameLobby,
  GameTurn,
  PlayerDataInTurn,
  PlayerResponse,
  PromptCardInGame,
  ResponseCardInGame
} from "../shared/types";

/** Returns Firestore subcollection reference of turns in lobby. */
function getTurnsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "turns")
    .withConverter(turnConverter);
}

/** Returns Firestore subcollection reference of remaining prompts in deck. */
function getPromptsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "deck_prompts")
    .withConverter(promptCardInGameConverter);
}

/** Returns Firestore subcollection reference of player responses in turn. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_responses")
    .withConverter(playerResponseConverter);
}

/** Returns Firestore subcollection reference of player responses in turn. */
function getPlayerHandRef(lobbyID: string, turnID: string, userID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_data", userID, "hand")
    .withConverter(responseCardInGameConverter);
}

/** Returns Firestore subcollection reference of player's discarded cards in turn. */
function getPlayerDiscardRef(lobbyID: string, turnID: string, userID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_data", userID, "discarded")
    .withConverter(responseCardInGameConverter);
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
async function updateTurn(lobbyID: string, turn: GameTurn): Promise<void> {
  await setDoc(doc(getTurnsRef(lobbyID), turn.id), turn);
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
async function updateHandCard(
  lobbyID: string, turnID: string, userID: string, card: ResponseCardInGame,
) {
  await setDoc(doc(getPlayerHandRef(lobbyID, turnID, userID), card.id), card);
}

/** Fetches all turns that occurred in the lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getDocs(getTurnsRef(lobbyID))).docs.map((d) => d.data());
}

/**
 * Finds the last turn in the lobby.
 * On the client side, it should alway be non-null.
 */
export async function getLastTurn(lobbyID: string): Promise<GameTurn | null> {
  const turns = (await getDocs(query(
    getTurnsRef(lobbyID),
    orderBy("time_created", "desc"),
    limit(1)))
  ).docs.map((d) => d.data());
  if (turns.length === 0) return null;
  return turns[0];
}

/** Selects a new random prompt from the remaining deck.
 * If no more prompts in deck, returns null. */
export async function pickNewPrompt(lobby: GameLobby): Promise<PromptCardInGame | null> {
  const prompts = (await getDocs(query(
    getPromptsRef(lobby.id), orderBy("random_index"), limit(1)))
  ).docs.map((d) => d.data());
  if (prompts.length === 0) return null;
  return prompts[0];
}

/** Removes this prompt card from the deck without playing it. */
export async function discardPrompt(lobby: GameLobby, card: PromptCardInGame) {
  await deleteDoc(doc(getPromptsRef(lobby.id), card.id));
}

/** Sets the given card as the prompt of the turn.
 * Also removes the prompt from the deck, so it can't be played again. */
export async function playPrompt(
  lobby: GameLobby, turn: GameTurn, card: PromptCardInGame) {
  if (turn.phase !== "new") {
    throw new Error(`Invalid turn phase to play prompt: ${turn.phase}`);
  }
  await discardPrompt(lobby, card);
  turn.prompt = card;
  turn.phase = "answering";
  await updateTurn(lobby.id, turn);
}

/** Proceeds turn to reading phase. */
export async function startReadingPhase(lobby: GameLobby, turn: GameTurn) {
  if (turn.phase !== "answering") {
    throw new Error(`Invalid turn phase to play prompt: ${turn.phase}`);
  }
  turn.phase = "reading";
  await updateTurn(lobby.id, turn);
}

/** Begins a new turn. */
export async function startNewTurn(lobby: GameLobby) {
  await newTurnFun({ lobby_id: lobby.id });
}

/** How many prompts remain in the deck */
export async function getPromptCount(lobby: GameLobby): Promise<number> {
  return (await getCountFromServer(getPromptsRef(lobby.id))).data().count;
}

/** Submit player's response */
export async function submitPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  data: PlayerDataInTurn,
  cards: ResponseCardInGame[],
) {
  const rng = RNG.fromTimestamp();
  const response = new PlayerResponse(
    data.player_uid, data.player_name, cards, rng.randomInt(), false);
  await setDoc(
    doc(getPlayerResponsesRef(lobby.id, turn.id), data.player_uid), response);
}

/** Retract player's response */
export async function cancelPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  data: PlayerDataInTurn,
) {
  await deleteDoc(
    doc(getPlayerResponsesRef(lobby.id, turn.id), data.player_uid));
}

/** Called by the judge when revealing a response. */
export async function revealPlayerResponse(
  lobby: GameLobby, turn: GameTurn, playerID: string,
) {
  const responseRef = doc(getPlayerResponsesRef(lobby.id, turn.id), playerID);
  await updateDoc(responseRef, { revealed: true });
}

/** Set winner of the current turn and set it to "complete". */
export async function chooseWinner(
  lobby: GameLobby, turn: GameTurn, winnerID: string,
) {
  turn.winner_uid = winnerID;
  turn.phase = "complete";
  await updateTurn(lobby.id, turn);
}

/** Reassign turn "judge" to a different user */
export async function setTurnJudge(lobby: GameLobby, turn: GameTurn, userID: string) {
  turn.judge_uid = userID;
  await updateTurn(lobby.id, turn);
}

/** Set card as downvoted. This will be copied to all following turns,
 * and recorded at the end of the game. */
export async function toggleDownvoteCard(
  lobby: GameLobby, turn: GameTurn, userID: string, card: ResponseCardInGame,
  downvoted: boolean,
) {
  card.downvoted = downvoted;
  await updateHandCard(lobby.id, turn.id, userID, card);
}

/** Set cards as discarded. When the next turn begins, these cards will be
 * removed from the player's hand, and their final score will decrease by 1. */
export async function discardCards(
  lobby: GameLobby, turn: GameTurn, userID: string, cards: ResponseCardInGame[],
) {
  const discardRef = getPlayerDiscardRef(lobby.id, turn.id, userID);
  const currentDiscard = (await getDocs(discardRef)).docs;
  await runTransaction(db, async (transaction) => {
    // Delete old discard:
    for (const oldDoc of currentDiscard) {
      transaction.delete(doc(discardRef, oldDoc.id));
    }
    for (const card of cards) {
      transaction.set(doc(discardRef, card.id), card);
    }
  });
}


type LastTurnHook = [
  lastTurn: GameTurn | null,
  loading: boolean,
  error: any,
]

/** Returns and subscribes to the current turn in the lobby. */
export function useLastTurn(lobbyID: string): LastTurnHook {
  const [lastTurn, setLastTurn] = useState<GameTurn | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnsSnap] = useCollection(getTurnsRef(lobbyID));
  useEffect(() => {
    setLoading(true);
    getLastTurn(lobbyID).then((turn) => {
      setLastTurn(turn);
      setLoading(false);
    }).catch((e) => {
      setError(e);
      setLoading(false);
    });
  }, [turnsSnap]);
  return [lastTurn, loading, error];
}

/** Returns and subscribes to all turns in the lobby. */
export function useAllTurns(lobby: GameLobby) {
  return useCollectionData(collection(lobbiesRef, lobby.id, "turns")
    .withConverter(turnConverter));
}

/** Returns to all turns in the lobby. */
export function useAllTurnsOnce(lobby: GameLobby) {
  return useCollectionDataOnce(collection(lobbiesRef, lobby.id, "turns")
    .withConverter(turnConverter));
}

/** Returns and subscribes to current user's player data in the current turn
 * in the lobby. */
export function usePlayerData(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useDocumentData(
    doc(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID)
      .withConverter(playerDataConverter));
}

/** Returns and subscribes to all users's player data in the current turn
 * in the lobby. */
export function useAllPlayerData(lobby: GameLobby, turn: GameTurn) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data")
      .withConverter(playerDataConverter));
}

/** Returns all users's player data in the current turn in the lobby. */
export function useAllPlayerDataOnce(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data")
      .withConverter(playerDataConverter));
}

/** Returns and subscribes to current user's player hand in the current turn
 * in the lobby. */
export function usePlayerHand(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "hand")
      .withConverter(responseCardInGameConverter));
}

/** Returns to current user's player hand in the current turn in the lobby. */
export function usePlayerHandOnce(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "hand")
      .withConverter(responseCardInGameConverter));
}

/** Returns and subscribes to current user's player response that they played
 * in the current turn in the lobby. */
export function usePlayerResponse(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useDocumentData(
    doc(lobbiesRef, lobby.id, "turns", turn.id, "player_responses", userID)
      .withConverter(playerResponseConverter));
}

/** Returns and subscribes to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponses(lobby: GameLobby, turn: GameTurn) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_responses")
      .withConverter(playerResponseConverter));
}

/** Returns to all players responses that they played
 * in the current turn in the lobby. */
export function useAllPlayerResponsesOnce(lobby: GameLobby, turn: GameTurn) {
  return useCollectionDataOnce(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_responses")
      .withConverter(playerResponseConverter));
}

/** Returns and subscribes to current user's player discarded cards
 * in the current turn in the lobby. */
export function usePlayerDiscard(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID, "discarded")
      .withConverter(responseCardInGameConverter));
}