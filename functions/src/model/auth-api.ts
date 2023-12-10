import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { firebaseAuth } from "../firebase-server";
import { GameLobby } from "../shared/types";

/** Asserts that current user is logged in. */
export function assertLoggedIn(event: CallableRequest) {
  if (!event.auth) {
    throw new HttpsError("unauthenticated", "Must log in before calling functions");
  }
}

/** Asserts that current user is the creator of the lobby */
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