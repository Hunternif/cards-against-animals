import { User } from "firebase/auth";
import { addDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { lobbiesRef } from "../firebase";
import { GameLobby } from "./types";

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  // Find current active lobby
  const currentQuery = query(lobbiesRef,
    where("status", "==", "new"),
    where("player_uids", "array-contains", user.uid)
  );
  const foundLobbies = (await getDocs(currentQuery)).docs;
  if (foundLobbies.length > 0) {
    const lobby = foundLobbies[0].data();
    console.log(`Found lobby ${lobby.id}`);
    return lobby;
  }
  // Create new lobby
  const newLobbyRef = doc(lobbiesRef);
  const newID = newLobbyRef.id;
  await setDoc(newLobbyRef, new GameLobby(newID, newID, user.uid, "new"));
  const lobby = (await getDoc(newLobbyRef)).data();
  if (!lobby) throw new Error("Couldn't create lobby");
  console.log(`Created new lobby ${lobby.id}`);
  return lobby;
}