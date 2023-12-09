import { HttpsError } from "firebase-functions/v2/https";
import { firebaseAuth } from "../firebase-server";

/** Returns registered user's name. If not found, throws. */
export async function getUserName(userID: string): Promise<string> {
  const userName = (await firebaseAuth.getUser(userID)).displayName;
  if (!userName) {
    throw new HttpsError("not-found", `User name not found: ${userID}`);
  }
  return userName;
}