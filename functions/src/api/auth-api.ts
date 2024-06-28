import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { firebaseAuth } from '../firebase-server';
import { GameLobby } from '../shared/types';
import { assertExhaustive } from '../shared/utils';
import { getPlayersRef } from './lobby-server-repository';
import { getLastTurn } from './turn-server-repository';
import { getCAAUser } from './user-server-api';

/** Asserts that current user is logged in. Returns user ID. */
export function assertLoggedIn(event: CallableRequest): string {
  if (!event.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Must log in before calling functions',
    );
  }
  return event.auth.uid;
}

/** Asserts that current user is allowed to control the lobby, based on settings. */
export async function assertLobbyControl(
  event: CallableRequest,
  lobby: GameLobby,
) {
  if (lobby.status === 'new') {
    // In a new lobby, only the creator has power:
    assertLobbyCreator(event, lobby);
  } else {
    // After the game starts, other players can contribute:
    switch (lobby.settings.lobby_control) {
      case 'creator':
        assertLobbyCreator(event, lobby);
        break;
      case 'czar':
        await assertCurrentJudge(event, lobby);
        break;
      case 'players':
        await assertPlayerInLobby(event, lobby.id);
        break;
      case 'anyone':
        break;
      default:
        assertExhaustive(lobby.settings.lobby_control);
    }
  }
}

/** Asserts that current user is a "player" in this lobby. */
export async function assertPlayerInLobby(
  event: CallableRequest,
  lobbyID: string,
) {
  if (!event.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Must log in before calling functions',
    );
  }
  const player = (
    await getPlayersRef(lobbyID).doc(event.auth.uid).get()
  ).data();
  if (!player || player.role !== 'player') {
    throw new HttpsError('unauthenticated', 'Must be a player in lobby');
  }
}

/** Asserts that current user is a judge in the current turn, or lobby creator. */
export async function assertCurrentJudge(
  event: CallableRequest,
  lobby: GameLobby,
) {
  assertLoggedIn(event);
  const lastTurn = await getLastTurn(lobby);
  if (!lastTurn) {
    assertLobbyCreator(event, lobby);
  } else {
    if (lastTurn.judge_uid !== event.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Must be lobby judge');
    }
  }
}

/** Asserts that current user is the creator of the lobby. */
export function assertLobbyCreator(event: CallableRequest, lobby: GameLobby) {
  assertLoggedIn(event);
  if (!event.auth || event.auth.uid !== lobby.creator_uid) {
    throw new HttpsError('unauthenticated', 'Must be lobby creator');
  }
}

/** Asserts that current user is admin. */
export async function assertAdmin(event: CallableRequest) {
  const userID = assertLoggedIn(event);
  const caaUser = await getCAAUser(userID);
  if (caaUser?.is_admin !== true) {
    throw new HttpsError('unauthenticated', 'Must be admin');
  }
}

/** Returns registered user's name. If not found, throws. */
export async function getUserName(userID: string): Promise<string> {
  const userName = (await firebaseAuth.getUser(userID)).displayName;
  return userName ?? 'UNKNOWN';
}
