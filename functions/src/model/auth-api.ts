import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { firebaseAuth } from "../firebase-server";
import { GameLobby } from "../shared/types";
import { getPlayersRef } from "./lobby-server-api";
import { getLastTurn } from "./turn-server-api";

/** Asserts that current user is logged in. */
export function assertLoggedIn(event: CallableRequest) {
  if (!event.auth) {
    throw new HttpsError("unauthenticated", "Must log in before calling functions");
  }
}

/** Asserts that current user is a "player" in this lobby. */
export async function assertPlayerInLobby(
  event: CallableRequest, lobbyID: string) {
  if (!event.auth) {
    throw new HttpsError("unauthenticated", "Must log in before calling functions");
  }
  const player = (await getPlayersRef(lobbyID).doc(event.auth.uid).get()).data();
  if (!player || player.role !== "player") {
    throw new HttpsError("unauthenticated", "Must be a player in lobby");
  }
}

/** Asserts that current user is a judge in the current turn. */
export async function assertCurrentJudge(
  event: CallableRequest, lobby: GameLobby) {
  assertLoggedIn(event);
  const lastTurn = await getLastTurn(lobby.id);
  if (!lastTurn) {
    assertLobbyCreator(event, lobby);
  } else {
    if (lastTurn.judge_uid !== event.auth?.uid) {
      throw new HttpsError("unauthenticated", "Must be lobby judge");
    }
  }
}

/** Asserts that current user is the creator of the lobby. */
export function assertLobbyCreator(
  event: CallableRequest, lobby: GameLobby) {
  assertLoggedIn(event);
  if (!event.auth || event.auth.uid !== lobby.creator_uid) {
    throw new HttpsError("unauthenticated", "Must be lobby creator");
  }
}

/** Returns registered user's name. If not found, throws. */
export async function getUserName(userID: string): Promise<string> {
  const userName = (await firebaseAuth.getUser(userID)).displayName;
  return userName ?? "UNKNOWN";
}