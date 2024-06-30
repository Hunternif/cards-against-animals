import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { lobbyConverter } from "../../shared/firestore-converters";
import { GameLobby } from "../../shared/types";

///////////////////////////////////////////////////////////////////////////////
//
//  This module containts methods to read and write lobby data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

export const lobbiesRef = collection(firestore, "lobbies").withConverter(
  lobbyConverter
);

/** Firestore ref to lobby. */
export function getLobbyRef(lobbyID: string) {
  return doc(lobbiesRef, lobbyID);
}

export async function getLobby(lobbyID: string): Promise<GameLobby | null> {
  return (await getDoc(getLobbyRef(lobbyID))).data() ?? null;
}

export async function updateLobby(lobby: GameLobby): Promise<void> {
  await updateDoc(getLobbyRef(lobby.id), lobbyConverter.toFirestore(lobby));
}
