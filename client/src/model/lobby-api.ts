import { User } from "firebase/auth";
import { getDocs, query, where } from "firebase/firestore";
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
  
  return new GameLobby("0", "test");
}