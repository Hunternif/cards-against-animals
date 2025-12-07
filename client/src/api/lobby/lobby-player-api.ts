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
import { changePlayerRoleFun, kickPlayerFun } from '../../firebase';
import {
  playerConverter,
  playerStateConverter,
} from '@shared/firestore-converters';
import {
  GameLobby,
  KickAction,
  PlayerGameState,
  PlayerInLobby,
  PlayerRole,
  PlayerStatus,
} from '@shared/types';
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

/** Firestore ref to a single player's game state in a lobby. */
export function getPlayerStateRef(lobbyID: string, userID: string) {
  return doc(getPlayerStatesRef(lobbyID), userID);
}

/** Firestore ref to list of player state data in a lobby. */
export function getPlayerStatesRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, 'player_states').withConverter(
    playerStateConverter,
  );
}

export async function updatePlayerState(
  lobbyID: string,
  state: PlayerGameState,
) {
  await updateDoc(
    getPlayerStateRef(lobbyID, state.uid),
    playerStateConverter.toFirestore(state),
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

export async function getAllPlayersStates(
  lobbyID: string,
): Promise<Array<PlayerGameState>> {
  return (await getDocs(getPlayerStatesRef(lobbyID))).docs.map((p) =>
    p.data(),
  );
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

/** Updates player role in the current game.
 * May not always be allowed, based on permission settings. */
export async function setMyPlayerRole(lobbyID: string, role: PlayerRole) {
  await changePlayerRoleFun({ lobby_id: lobbyID, role });
}

/** Sets the given player's status as "kicked", so they can't re-join. */
export async function kickPlayer(
  lobby: GameLobby,
  player: PlayerInLobby,
  action: KickAction,
) {
  await kickPlayerFun({ lobby_id: lobby.id, user_id: player.uid, action });
}
