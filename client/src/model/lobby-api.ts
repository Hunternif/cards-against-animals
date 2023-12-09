import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { findOrCreateLobbyAndJoinFun, findOrCreateLobbyFun, joinLobbyFun, lobbiesRef } from "../firebase";
import { GameLobby } from "../shared/types";
import { useEffect, useState } from "react";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";

export async function getLobby(lobbyID: string): Promise<GameLobby | null> {
  return (await getDoc(doc(lobbiesRef, lobbyID))).data() ?? null;
}

export async function findOrCreateLobbyID(user: User): Promise<string> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid });
  return res.data.lobby_id;
}

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const lobbyID = await findOrCreateLobbyID(user);
  const lobby = await getLobby(lobbyID);
  if (!lobby) throw new Error("Couldn't find or create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export async function joinLobby(lobbyID: string, user: User): Promise<void> {
  await joinLobbyFun({ lobby_id: lobbyID, user_id: user.uid });
}

/**
 * Will find an active game or create a new one, and attempt to join.
 * Returns lobby ID.
 */
export async function findOrCreateLobbyAndJoin(user: User): Promise<string> {
  const res = await findOrCreateLobbyAndJoinFun({ user_id: user.uid });
  return res.data.lobby_id;
}

async function getLobbyAndjoin(lobbyID: string, user: User) {
  const lobby = await getLobby(lobbyID);
  if (!lobby) throw new Error(`Couldn't find lobby ${lobbyID}`);
  if (!lobby.hasPlayerID(user.uid)) {
    await joinLobby(lobbyID, user);
  }
}

/** React hook to join lobby */
export function useJoinLobby(lobbyID: string, user: User): [joined: boolean] {
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    getLobbyAndjoin(lobbyID, user).then(() => {
      setJoined(true);
    });
  }, [lobbyID, user.uid]);
  return [joined];
}

