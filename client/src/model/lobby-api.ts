import { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore";
import { findOrCreateLobbyAndJoinFun, findOrCreateLobbyFun, joinLobbyFun, lobbiesRef, usersRef } from "../firebase";
import { GameLobby, PlayerInLobby } from "../shared/types";
import { playerConverter } from "./firebase-converters";
import { getCAAUser } from "./users-api";

export async function getLobby(lobbyID: string): Promise<GameLobby | null> {
  return (await getDoc(doc(lobbiesRef, lobbyID))).data() ?? null;
}

export async function getPlayerInLobby(lobbyID: string, userID: string):
  Promise<PlayerInLobby | null> {
  const playersRef = collection(lobbiesRef, lobbyID, 'players')
    .withConverter(playerConverter);
  return (await getDoc(doc(playersRef, userID))).data() ?? null;
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

/** Remove yourself from this lobby */
export async function leaveLobby(lobby: GameLobby, user: User): Promise<void> {
  const playersRef = collection(lobbiesRef, lobby.id, 'players')
    .withConverter(playerConverter);
  // Delete your 'player' document in lobby:
  await deleteDoc(doc(playersRef, user.uid));
  // Delete your user info which contains 'current lobby':
  await deleteDoc(doc(usersRef, user.uid));
}

/**
 * Will find an active game or create a new one, and attempt to join.
 * Returns lobby ID.
 */
export async function findOrCreateLobbyAndJoin(user: User): Promise<string> {
  const res = await findOrCreateLobbyAndJoinFun({ user_id: user.uid });
  return res.data.lobby_id;
}

async function joinLobbyIfNeeded(lobbyID: string, user: User) {
  const caaUser = await getCAAUser(user.uid);
  if (caaUser?.current_lobby_id !== lobbyID) {
    await joinLobby(lobbyID, user);
  }
}

/** React hook to join lobby */
export function useJoinLobby(lobbyID: string, user: User): [joined: boolean] {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    joinLobbyIfNeeded(lobbyID, user).then(() => {
      setJoined(true);
    }).catch((e) => setError(e));
  }, [lobbyID, user.uid]);
  if (error) throw error;
  return [joined];
}

/** React hook to fetch lobby data and subscribes to it. */
export function useLobby(lobbyID: string) {
  return useDocumentData(doc(lobbiesRef, lobbyID));
}

/** React hook to fetch list of players and subscribes to it. */
export function usePlayers(lobbyID: string) {
  return useCollectionData(
    collection(lobbiesRef, lobbyID, 'players')
      .withConverter(playerConverter)
  );
}