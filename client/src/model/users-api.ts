import { deleteField, doc, getDoc, updateDoc } from "firebase/firestore";
import { firebaseAuth, usersRef } from "../firebase";
import { CAAUser } from "../shared/types";
import { User } from "firebase/auth";
import { getLobby, getPlayerInLobby, leaveLobby } from "./lobby-api";
import { useDocumentData, useDocumentDataOnce } from "react-firebase-hooks/firestore";

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

/**
 * If the user has a saved "current lobby", returns that lobby ID.
 * If the user has been kicked from that lobby, or it ended, clears it.
 */
export async function findPastLobbyID(userID: string): Promise<string | null> {
  const caaUser = await getCAAUser(userID);
  if (caaUser?.current_lobby_id) {
    const player = await getPlayerInLobby(caaUser.current_lobby_id, userID);
    if (player?.status === "kicked") {
      await updateDoc(doc(usersRef, userID), { current_lobby_id: deleteField() });
      return null;
    }
    const lobby = await getLobby(caaUser.current_lobby_id);
    if (lobby?.status === "ended") {
      await updateDoc(doc(usersRef, userID), { current_lobby_id: deleteField() });
      return null;
    }
  }
  return null;
}

/** React hook to fetch user data and subscribe to it. */
export function useCAAUser(userID: string) {
  return useDocumentData(doc(usersRef, userID));
}

/** React hook to fetch user data, without subscribing to it. */
export function useCAAUserOnce(userID: string) {
  return useDocumentDataOnce(doc(usersRef, userID));
}