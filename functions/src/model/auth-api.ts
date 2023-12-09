import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { firebaseAuth } from "../firebase-server";

export async function assertLoggedIn(event: CallableRequest) {
  if (!event.auth) {
    throw new HttpsError("unauthenticated", "Must log in before calling functions");
  }
}

/** Returns registered user's name. If not found, throws. */
export async function getUserName(userID: string): Promise<string> {
  const userName = (await firebaseAuth.getUser(userID)).displayName;
  if (!userName) {
    throw new HttpsError("not-found", `User name not found: ${userID}`);
  }
  return userName;
}