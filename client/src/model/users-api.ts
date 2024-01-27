import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firebaseAuth, usersRef } from "../firebase";
import { CAAUser } from "../shared/types";
import { User, updateProfile } from "firebase/auth";
import { getLobby, getPlayerInLobby, leaveLobby } from "./lobby-api";
import { useDocumentData, useDocumentDataOnce } from "react-firebase-hooks/firestore";
import { avatarMap } from "../components/Avatars";

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await getDoc(doc(usersRef, userID))).data() ?? null;
}

/** Creates or updates user data */
export async function updateUserData(
  user: User, name: string, avatar_id?: string
): Promise<CAAUser> {
  const avatar = avatar_id ? avatarMap.get(avatar_id) : undefined;
  // Update Firebase user info:
  await updateProfile(user, {
    displayName: name,
    photoURL: avatar?.url,
  });

  // Update CAA user info:
  const caaUser = await getCAAUser(user.uid);
  if (caaUser) {
    caaUser.name = name;
    caaUser.avatar_id = avatar_id;
    await setDoc(doc(usersRef, user.uid), caaUser);
    return caaUser;
  } else {
    const newUser = new CAAUser(user.uid, null, name, avatar_id);
    await setDoc(doc(usersRef, user.uid), newUser);
    return newUser;
  }
}

/**
 * Signs out of Firebase.
 * Also, if the user is anonymous, leaves the active lobby,
 * because there will be no way to log back in to the same user.
 */
export async function signOut(user: User) {
  // If anonymous, leave current lobby:
  if (user.isAnonymous) {
    const caaUser = await getCAAUser(user.uid);
    if (caaUser && caaUser.current_lobby_id) {
      const activeLobby = await getLobby(caaUser.current_lobby_id);
      if (activeLobby) {
        await leaveLobby(activeLobby, user.uid);
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