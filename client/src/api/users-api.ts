import { User, updateProfile } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseAuth, firestore } from '../firebase';
import {
  deckLockConverter,
  userConverter,
} from '../shared/firestore-converters';
import { CAAUser } from '../shared/types';
import { avatarMap } from './avatars';
import { leaveLobby } from './lobby/lobby-join-api';
import { getPlayerInLobby } from './lobby/lobby-player-api';
import { getLobby } from './lobby/lobby-repository';

const usersRef = collection(firestore, 'users').withConverter(userConverter);

export function getCAAUserRef(userID: string) {
  return doc(usersRef, userID);
}

export function getUserDeckLocksRef(userID: string) {
  return collection(firestore, `users/${userID}/deck_keys`).withConverter(
    deckLockConverter,
  );
}

/** Finds user data by ID */
export async function getCAAUser(userID: string): Promise<CAAUser | null> {
  return (await getDoc(getCAAUserRef(userID))).data() ?? null;
}

/** Finds or creates user data from Firebase user. */
export async function getOrCreateCAAUser(
  userID: string,
  name: string,
  avatarID?: string,
): Promise<CAAUser> {
  const caaUser = await getCAAUser(userID);
  if (caaUser) return caaUser;
  else {
    const newUser = new CAAUser(userID, null, name, avatarID, false);
    await setDoc(doc(usersRef, userID), newUser);
    return newUser;
  }
}

/** Creates or updates user data */
export async function updateUserData(
  userID: string,
  name: string,
  avatarID?: string,
): Promise<CAAUser> {
  const avatar = avatarID ? avatarMap.get(avatarID) : undefined;
  // Update Firebase user info:
  const user = firebaseAuth.currentUser;
  if (user) {
    await updateProfile(user, {
      displayName: name,
      photoURL: avatar?.url,
    });
  }

  // Update CAA user info:
  const caaUser = await getCAAUser(userID);
  if (caaUser) {
    caaUser.name = name;
    caaUser.avatar_id = avatarID;
    await updateDoc(doc(usersRef, userID), userConverter.toFirestore(caaUser));
    return caaUser;
  } else {
    const newUser = new CAAUser(userID, null, name, avatarID);
    await setDoc(doc(usersRef, userID), newUser);
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
    if (player?.status === 'banned') {
      await updateDoc(doc(usersRef, userID), {
        current_lobby_id: deleteField(),
      });
      return null;
    }
    const lobby = await getLobby(caaUser.current_lobby_id);
    if (lobby?.status === 'ended') {
      await updateDoc(doc(usersRef, userID), {
        current_lobby_id: deleteField(),
      });
      return null;
    }
    return caaUser.current_lobby_id;
  }
  return null;
}
