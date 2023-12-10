import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, usersRef } from "../firebase";
import { CAAUser } from "../shared/types";
import { User } from "firebase/auth";
import { getLobby, leaveLobby } from "./lobby-api";

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await getDoc(doc(usersRef, userID))).data() ?? null;
}

/**
 * Signs out of Firebase.
 * Also, if the user is anonymous, leaves the active lobby,
 * because there will be no way to log back in to the same user.
 */
export async function signOut(user: User) {
  // If anonymouse, leave current lobby:
  if (user.isAnonymous) {
    const caaUser = await getCAAUser(user.uid);
    if (caaUser && caaUser.current_lobby_id) {
      const activeLobby = await getLobby(caaUser.current_lobby_id);
      if (activeLobby) {
        await leaveLobby(activeLobby, user);
      }
    }
  }
  // Then actually sign out:
  await firebaseAuth.signOut();
}