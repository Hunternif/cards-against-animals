import { User } from "firebase/auth";
import {
  findOrCreateLobbyAndJoinFun,
  findOrCreateLobbyFun,
  joinLobbyFun,
} from "../../firebase";
import { CAAUser, GameLobby } from "../../shared/types";
import {
  getPlayerInLobby,
  setPlayerStatus,
  updatePlayer,
} from "./lobby-player-api";
import { getLobby } from "./lobby-repository";

///////////////////////////////////////////////////////////////////////////////
//
//  API related to creating & joining a lobby.
//
///////////////////////////////////////////////////////////////////////////////

export async function findOrCreateLobbyID(user: User): Promise<string> {
  const res = await findOrCreateLobbyFun({ creator_uid: user.uid });
  return res.data.lobby_id;
}

export async function findOrCreateLobby(user: User): Promise<GameLobby> {
  const lobbyID = await findOrCreateLobbyID(user);
  const lobby = await getLobby(lobbyID);
  if (!lobby) throw new Error("Couldn't find or create lobby");
  console.log(`Fetched lobby ${lobby.id}`);
  return lobby;
}

/**
 * Will find an active game or create a new one, and attempt to join.
 * Returns lobby ID.
 */
export async function findOrCreateLobbyAndJoin(user: User): Promise<string> {
  const res = await findOrCreateLobbyAndJoinFun({ user_id: user.uid });
  return res.data.lobby_id;
}

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export async function joinLobby(
  lobbyID: string,
  userID: string,
): Promise<void> {
  await joinLobbyFun({ lobby_id: lobbyID, user_id: userID });
}

/** Remove yourself from this lobby */
export async function leaveLobby(
  lobby: GameLobby | string,
  userID: string,
): Promise<void> {
  const lobbyID = lobby instanceof GameLobby ? lobby.id : lobby;
  await setPlayerStatus(lobbyID, userID, "left");
}

/** If the user is not already in the lobby, joins it. */
export async function joinLobbyIfNeeded(lobbyID: string, caaUser: CAAUser) {
  if (!(await isUserInLobby(lobbyID, caaUser.uid))) {
    await joinLobby(lobbyID, caaUser.uid);
  }
  // Update player name & avatar:
  const player = await getPlayerInLobby(lobbyID, caaUser.uid);
  if (player) {
    player.name = caaUser.name;
    player.avatar_id = caaUser.avatar_id;
    // If previously left, re-join:
    if (player?.status === "left") {
      player.status = "online";
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
