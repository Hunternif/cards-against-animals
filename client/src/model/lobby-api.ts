import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { findOrCreateLobbyFun, lobbiesRef } from "../firebase";
import { GameLobby } from "./types";

export async function findOrCreateLobbyID(user: User): Promise<string> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid});
  return res.data.lobby_id;
}

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const lobbyID = await findOrCreateLobbyID(user);
  const lobby = (await getDoc(doc(lobbiesRef, lobbyID))).data();
  if (!lobby) throw new Error("Couldn't create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}