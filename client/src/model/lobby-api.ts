import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { findOrCreateLobbyFun, lobbiesRef } from "../firebase";
import { GameLobby } from "./types";

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid});
  const lobby = (await getDoc(doc(lobbiesRef, res.data.lobby_id))).data();
  if (!lobby) throw new Error("Couldn't create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}