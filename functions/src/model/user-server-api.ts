import { usersRef } from "../firebase-server";
import { CAAUser } from "../shared/types";
import { getUserName } from "./auth-api";

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await usersRef.doc(userID).get()).data() ?? null;
}

/**
 * Sets this lobby as the user's current lobby, so they can log back into it.
 * If user data doesn't exist, it will be created.
 */
export async function setUsersCurrentLobby(userID: string, lobbyID: string) {
  const caaUser = await getCAAUser(userID);
  if (caaUser) {
    caaUser.current_lobby_id = lobbyID;
    await usersRef.doc(userID).set(caaUser);
  } else {
    const userName = await getUserName(userID);
    const newUser = new CAAUser(userID, null, userName, false, lobbyID);
    await usersRef.doc(userID).set(newUser);
  }
}