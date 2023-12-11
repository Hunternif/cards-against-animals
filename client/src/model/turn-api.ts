import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { lobbiesRef } from "../firebase";
import { playerDataConverter, turnConverter } from "./firebase-converters";
import { GameLobby, GameTurn } from "../shared/types";
import { useCollection, useDocumentData } from "react-firebase-hooks/firestore";
import { useEffect, useState } from "react";

/** Returns Firestore subcollection reference. */
function getTurnsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, "turns")
    .withConverter(turnConverter);
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