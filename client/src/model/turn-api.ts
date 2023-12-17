// Client APIs for game turns, when the game is in progress.

import {
  collection, deleteDoc, doc,
  getCountFromServer,
  getDocs, limit, orderBy,
  query, setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useCollection, useCollectionData, useDocumentData } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../firebase";
import { GameLobby, GameTurn, PlayerResponse, PromptCardInGame, ResponseCardInGame } from "../shared/types";
import { randomIndex } from "../shared/utils";
import {
  playerDataConverter,
  playerResponseConverter,
  promptCardInGameConverter,
  turnConverter
} from "./firebase-converters";

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

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
async function updateTurn(lobbyID: string, turn: GameTurn): Promise<void> {
  await setDoc(doc(getTurnsRef(lobbyID), turn.id), turn);
}

/**
 * Finds the last turn in the lobby.
 * On the client side, it should alway be non-null.
 */
export async function getLastTurn(lobbyID: string): Promise<GameTurn> {
  const turns = (await getDocs(query(
    getTurnsRef(lobbyID),
    orderBy("time_created", "desc"),
    limit(1)))
  ).docs.map((d) => d.data());
  if (turns.length === 0) throw new Error("No turns found");
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

/** How many prompts remain in the deck */
export async function getPromptCount(lobby: GameLobby): Promise<number> {
  return (await getCountFromServer(getPromptsRef(lobby.id))).data().count;
}

/** Submit player's response */
export async function submitPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  userName: string,
  cards: ResponseCardInGame[],
) {
  const response = new PlayerResponse(userID, userName, cards, randomIndex(), false)
  await setDoc(doc(getPlayerResponsesRef(lobby.id, turn.id), userID), response);
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
    });
  }, [turnsSnap]);
  return [lastTurn, loading, error];
}

/** Returns and subscribes to current user's player data in the current turn
 * in the lobby. */
export function usePlayerData(lobby: GameLobby, turn: GameTurn, userID: string) {
  return useDocumentData(
    doc(lobbiesRef, lobby.id, "turns", turn.id, "player_data", userID)
      .withConverter(playerDataConverter));
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