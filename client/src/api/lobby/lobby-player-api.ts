import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { kickPlayerFun } from '../../firebase';
import { playerConverter } from '../../shared/firestore-converters';
import {
  GameLobby,
  KickAction,
  PlayerInLobby,
  PlayerStatus,
} from '../../shared/types';
import { lobbiesRef } from './lobby-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  This module containts methods to read and write player data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//  Also contains API methods.
//
///////////////////////////////////////////////////////////////////////////////

/** Firestore ref to a single players in a lobby. */
export function getPlayerRef(lobbyID: string, userID: string) {
  return doc(getPlayersRef(lobbyID), userID);
}

/** Firestore ref to list of players in a lobby. */
export function getPlayersRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, 'players').withConverter(
    playerConverter,
  );
}

export async function updatePlayer(lobbyID: string, player: PlayerInLobby) {
  await updateDoc(
    getPlayerRef(lobbyID, player.uid),
    playerConverter.toFirestore(player),
  );
}

export async function getPlayerInLobby(
  lobbyID: string,
  userID: string,
): Promise<PlayerInLobby | null> {
  return (await getDoc(getPlayerRef(lobbyID, userID))).data() ?? null;
}

export async function getAllPlayersInLobby(
  lobbyID: string,
): Promise<Array<PlayerInLobby>> {
  return (await getDocs(getPlayersRef(lobbyID))).docs.map((p) => p.data());
}

export async function getAllActivePlayersInLobby(
  lobbyID: string,
): Promise<Array<PlayerInLobby>> {
  return (await getAllPlayersInLobby(lobbyID)).filter(
    (p) => p.role === 'player' && p.status === 'online',
  );
}

export async function getActivePlayerCount(lobbyID: string): Promise<number> {
  return (
    await getCountFromServer(
      query(
        getPlayersRef(lobbyID),
        where('role', '==', 'player'),
        where('status', '==', 'online'),
      ),
    )
  ).data().count;
}

/** Updates player status in the current game. */
export async function setPlayerStatus(
  lobbyID: string,
  userID: string,
  status: PlayerStatus,
) {
  const player = await getPlayerInLobby(lobbyID, userID);
  if (player) {
    player.status = status;
    await updatePlayer(lobbyID, player);
  }
}

/** Sets the given player's status as "kicked", so they can't re-join. */
export async function kickPlayer(
  lobby: GameLobby,
  player: PlayerInLobby,
  action: KickAction,
) {
  await kickPlayerFun({ lobby_id: lobby.id, user_id: player.uid, action });
}
