import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useCollection, useCollectionData, useDocumentData } from "react-firebase-hooks/firestore";
import { lobbiesRef } from "../firebase";
import { GameLobby, GameTurn, PlayerResponse, ResponseCardInGame } from "../shared/types";
import {
  playerDataConverter,
  playerResponseConverter,
  turnConverter
} from "./firebase-converters";

/** Returns Firestore subcollection reference. */
function getTurnsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "turns")
    .withConverter(turnConverter);
}

/** Returns Firestore subcollection reference. */
function getPlayerResponsesRef(lobbyID: string, turnID: string) {
  return collection(lobbiesRef, lobbyID, "turns", turnID, "player_responses")
    .withConverter(playerResponseConverter);
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

/** Submit player's response */
export async function submitPlayerResponse(
  lobby: GameLobby,
  turn: GameTurn,
  userID: string,
  userName: string,
  cards: ResponseCardInGame[],
) {
  const response = new PlayerResponse(userID, userName, cards)
  await setDoc(doc(getPlayerResponsesRef(lobby.id, turn.id), userID), response);
}

type LastTurnHook = [
  lastTurn: GameTurn | null,
  loading: boolean,
]

/** Returns and subscribes to the current turn in the lobby. */
export function useLastTurn(lobbyID: string): LastTurnHook {
  const [lastTurn, setLastTurn] = useState<GameTurn | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnsSnap] = useCollection(getTurnsRef(lobbyID));
  useEffect(() => {
    setLoading(true);
    getLastTurn(lobbyID).then((turn) => {
      setLastTurn(turn);
      setLoading(false);
    }).catch((e) => {
      console.log(e);
      // Ignore the exception while new turns are added.
    });
  }, [turnsSnap]);
  return [lastTurn, loading];
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