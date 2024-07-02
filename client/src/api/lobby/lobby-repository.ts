import {
  Transaction,
  collection,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import { lobbyConverter } from '../../shared/firestore-converters';
import { GameLobby } from '../../shared/types';

///////////////////////////////////////////////////////////////////////////////
//
//  This module containts methods to read and write lobby data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

export const lobbiesRef = collection(firestore, 'lobbies').withConverter(
  lobbyConverter,
);

/** Firestore ref to lobby. */
export function getLobbyRef(lobbyID: string) {
  return doc(lobbiesRef, lobbyID);
}

export async function getLobby(
  lobbyID: string,
  transaction?: Transaction,
): Promise<GameLobby | null> {
  const ref = getLobbyRef(lobbyID);
  if (transaction) {
    return (await transaction.get(ref)).data() ?? null;
  } else {
    return (await getDoc(ref)).data() ?? null;
  }
}

export async function updateLobby(
  lobby: GameLobby,
  transaction?: Transaction,
): Promise<void> {
  const ref = getLobbyRef(lobby.id);
  const data = lobbyConverter.toFirestore(lobby);
  if (transaction) {
    transaction.update(ref, data);
  } else {
    await updateDoc(ref, data);
  }
}
