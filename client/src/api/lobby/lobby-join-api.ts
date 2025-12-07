import {
  addBotToLobbyFun,
  createLobbyAsCopyFun,
  findOrCreateLobbyAndJoinFun,
  joinLobbyFun,
} from '../../firebase';
import { CAAUser, GameLobby } from '@shared/types';
import {
  getPlayerInLobby,
  setPlayerStatus,
  updatePlayer,
} from './lobby-player-api';

///////////////////////////////////////////////////////////////////////////////
//
//  API related to creating & joining a lobby.
//
///////////////////////////////////////////////////////////////////////////////

/**
 * Will find an active game or create a new one, and attempt to join.
 * Returns lobby ID.
 */
export async function findOrCreateLobbyAndJoin(): Promise<string> {
  const res = await findOrCreateLobbyAndJoinFun();
  return res.data.lobby_id;
}

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export async function joinLobby(lobbyID: string): Promise<void> {
  await joinLobbyFun({ lobby_id: lobbyID });
}

/**
 * Creates a new lobby by copying all settings and players from the given lobby.
 * Returns new lobby ID.
 */
export async function createLobbyAsCopy(oldLobbyID: string): Promise<string> {
  const res = await createLobbyAsCopyFun({ old_lobby_id: oldLobbyID });
  return res.data.new_lobby_id;
}

/** Remove yourself from this lobby */
export async function leaveLobby(
  lobby: GameLobby | string,
  userID: string,
): Promise<void> {
  const lobbyID = lobby instanceof GameLobby ? lobby.id : lobby;
  await setPlayerStatus(lobbyID, userID, 'left');
}

/** If the user is not already in the lobby, joins it. */
export async function joinLobbyIfNeeded(lobbyID: string, caaUser: CAAUser) {
  if (!(await isUserInLobby(lobbyID, caaUser.uid))) {
    await joinLobby(lobbyID);
  }
  // Update player name & avatar:
  const player = await getPlayerInLobby(lobbyID, caaUser.uid);
  if (player) {
    player.name = caaUser.name;
    player.avatar_id = caaUser.avatar_id;
    // If previously left, re-join:
    if (player?.status === 'left') {
      player.status = 'online';
    }
    await updatePlayer(lobbyID, player);
  }
}

async function isUserInLobby(
  lobbyID: string,
  userID: string,
): Promise<boolean> {
  try {
    const player = await getPlayerInLobby(lobbyID, userID);
    return player !== null;
  } catch (e: any) {
    return false;
  }
}

export async function addBotToLobby(lobbyID: string, botUID: string) {
  await addBotToLobbyFun({ lobby_id: lobbyID, bot_uid: botUID });
}
