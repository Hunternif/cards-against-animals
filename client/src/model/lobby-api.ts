import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { findOrCreateLobbyFun, joinLobbyFun, lobbiesRef } from "../firebase";
import { GameLobby } from "../shared/types";

export async function findOrCreateLobbyID(user: User): Promise<string> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid });
  return res.data.lobby_id;
}

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const lobbyID = await findOrCreateLobbyID(user);
  const lobby = (await getDoc(doc(lobbiesRef, lobbyID))).data();
  if (!lobby) throw new Error("Couldn't create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export async function joinLobby(user: User, lobbyID: string): Promise<void> {
  await joinLobbyFun({ user_id: user.uid, lobby_id: lobbyID });
}