import { Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore, lobbiesRef } from '../firebase-server';
import {
  lobbyConverter,
  playerConverter,
  playerStateConverter,
} from '../shared/firestore-converters';
import {
  GameLobby,
  PlayerGameState,
  PlayerInLobby,
  PlayerRole,
} from '../shared/types';

///////////////////////////////////////////////////////////////////////////////
//
//  This module containts methods to read and write lobby data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

export function getPlayersRef(lobbyID: string) {
  return firestore
    .collection(`lobbies/${lobbyID}/players`)
    .withConverter(playerConverter);
}

export function getPlayerStatesRef(lobbyID: string) {
  return firestore
    .collection(`lobbies/${lobbyID}/player_states`)
    .withConverter(playerStateConverter);
}

/** Finds lobby by ID, or throws HttpsError. */
export async function getLobby(lobbyID: string): Promise<GameLobby> {
  const lobby = (await lobbiesRef.doc(lobbyID).get()).data();
  if (!lobby) throw new HttpsError('not-found', `Lobby not found: ${lobbyID}`);
  return lobby;
}

/**
 * Updates lobby state in Firestore.
 * Does not update subcollections! (players, turns, deck etc)
 */
export async function updateLobby(lobby: GameLobby): Promise<void> {
  await lobbiesRef.doc(lobby.id).update(lobbyConverter.toFirestore(lobby));
}

/** Updates player data in lobby in Firestore. */
export async function updatePlayer(
  lobbyID: string,
  player: PlayerInLobby,
  transaction?: Transaction,
) {
  const ref = getPlayersRef(lobbyID).doc(player.uid);
  const data = playerConverter.toFirestore(player);
  if (transaction) {
    transaction.update(ref, data);
  } else {
    await ref.update(data);
  }
}

/** Updates player game state data in lobby in Firestore. */
export async function updatePlayerState(
  lobbyID: string,
  state: PlayerGameState,
  transaction?: Transaction,
) {
  const ref = getPlayerStatesRef(lobbyID).doc(state.uid);
  const data = playerStateConverter.toFirestore(state);
  if (transaction) {
    transaction.update(ref, data);
  } else {
    await ref.update(data);
  }
}

/** Find player in this lobby. */
export async function getPlayer(
  lobbyID: string,
  userID: string,
): Promise<PlayerInLobby | null> {
  return (await getPlayersRef(lobbyID).doc(userID).get()).data() ?? null;
}

/** Find player in this lobby or throws. */
export async function getPlayerThrows(
  lobbyID: string,
  userID: string,
): Promise<PlayerInLobby> {
  const player = await getPlayer(lobbyID, userID);
  if (!player) {
    throw new HttpsError(
      'not-found',
      `Player data not found for user ${userID}`,
    );
  }
  return player;
}

/** Finds player game state in this lobby. */
export async function getPlayerState(
  lobbyID: string,
  userID: string,
): Promise<PlayerGameState | null> {
  return (await getPlayerStatesRef(lobbyID).doc(userID).get()).data() ?? null;
}

/** Finds or creates player game state in this lobby. */
export async function getOrCreatePlayerState(
  lobbyID: string,
  userID: string,
): Promise<PlayerGameState> {
  const state = await getPlayerState(lobbyID, userID);
  if (state == null) {
    const newState = new PlayerGameState(userID, 0, 0, 0, 0);
    await getPlayerStatesRef(lobbyID).doc(userID).set(newState);
    return newState;
  } else {
    return state;
  }
}

/** Returns all players in this lobby, by role. */
export async function getPlayers(
  lobbyID: string,
  role?: PlayerRole,
): Promise<Array<PlayerInLobby>> {
  if (!role) {
    // Fetch all players
    return (await getPlayersRef(lobbyID).get()).docs.map((p) => p.data());
  } else {
    return (
      await getPlayersRef(lobbyID).where('role', '==', role).get()
    ).docs.map((p) => p.data());
  }
}

/** Counts players in this lobby with this role. */
export async function countPlayers(
  lobbyID: string,
  role?: PlayerRole,
): Promise<number> {
  if (!role) {
    // Fetch all players
    return (await getPlayersRef(lobbyID).count().get()).data().count;
  } else {
    return (
      await getPlayersRef(lobbyID).where('role', '==', role).count().get()
    ).data().count;
  }
}

/** Get active "online" players, usable for game functions. */
export async function getOnlinePlayers(
  lobbyID: string,
): Promise<Array<PlayerInLobby>> {
  return (await getPlayers(lobbyID)).filter(
    (p) => p.role === 'player' && p.status === 'online',
  );
}

/** Get all player game state data. */
export async function getPlayerStates(
  lobbyID: string,
): Promise<Array<PlayerGameState>> {
  return (await getPlayerStatesRef(lobbyID).get()).docs.map((d) => d.data());
}
