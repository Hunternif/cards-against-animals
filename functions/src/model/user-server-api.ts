import { FieldValue } from "firebase-admin/firestore";
import { usersRef } from "../firebase-server";
import { CAAUser } from "../shared/types";
import { getUserName } from "./auth-api";

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await usersRef.doc(userID).get()).data() ?? null;
}

/** Finds or creates user data by ID */
export async function getOrCreateCAAUser(userID: string): Promise<CAAUser> {
  const caaUser = await getCAAUser(userID);
  if (caaUser) return caaUser;
  else {
    const userName = await getUserName(userID);
    const newUser = new CAAUser(userID, null, userName, null, false);
    await usersRef.doc(userID).set(newUser);
    return newUser;
  }
}

export async function updateCAAUser(caaUser: CAAUser): Promise<void> {
  await usersRef.doc(caaUser.uid).set(caaUser);
}

/**
 * Sets this lobby as the user's current lobby, so they can log back into it.
 * If user data doesn't exist, it will be created.
 * If lobbyID is undefined, it will delete it.
 */
export async function setUsersCurrentLobby(userID: string, lobbyID?: string) {
  const caaUser = await getCAAUser(userID);
  if (lobbyID) {
    // Set current lobby:
    const caaUser = await getOrCreateCAAUser(userID);
    caaUser.current_lobby_id = lobbyID;
    await usersRef.doc(userID).set(caaUser);
  } else {
    // Delete current lobby:
    if (caaUser) {
      await usersRef.doc(userID).update({ current_lobby_id: FieldValue.delete() });
    }
  }
}