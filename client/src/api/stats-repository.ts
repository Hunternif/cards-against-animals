import {
  globalStatsConverter,
  userStatsConverter,
} from '@shared/firestore-converters';
import {
  GlobalStats,
  UserMergeMap,
  UserStats,
  YearFilter,
} from '@shared/types';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase';

///////////////////////////////////////////////////////////////////////////////
//
//  Firestore persistence functions
//
//  stats/
//  ├── merged_users/users/
//  │   ├── {canonical_uid_1}
//  │   ├── {canonical_uid_2}
//  │   └── ...
//  ├── all_time/users/
//  │   ├── global
//  │   ├── {player_uid_1}
//  │   ├── {player_uid_2}
//  │   └── ...
//  ├── 2023/users/
//  │   ├── global
//  │   └── ...
//  ├── 2024/users/
//  │   └── ...
//  └── ...
//
///////////////////////////////////////////////////////////////////////////////

const statsRef = collection(firestore, 'stats');

/** Returns Firestore collection reference for the specified year. */
async function getYearColRef(year: YearFilter) {
  const docRef = doc(statsRef, year.toString());
  if (!(await getDoc(docRef)).exists()) {
    await setDoc(docRef, {});
  }
  return collection(docRef, 'users');
}

async function getMergedUsersColRef() {
  const docRef = doc(statsRef, 'merged_users');
  if (!(await getDoc(docRef)).exists()) {
    await setDoc(docRef, {});
  }
  return collection(docRef, 'users');
}

/**
 * Saves user statistics to Firestore under the specified year.
 * @param userStats The user statistics to save
 * @param year The year to save under ('all_time' or a year number)
 */
export async function saveUserStats(
  userStats: UserStats[],
  year: YearFilter,
): Promise<void> {
  const batch = writeBatch(firestore);
  const yearColRef = await getYearColRef(year);

  for (const stats of userStats) {
    const docRef = doc(yearColRef, stats.uid).withConverter(userStatsConverter);
    batch.set(docRef, stats);
  }

  await batch.commit();
}

/**
 * Saves global statistics to Firestore under the specified year.
 * @param globalStats The global statistics to save
 * @param year The year to save under ('all_time' or a year number)
 */
export async function saveGlobalStats(
  globalStats: GlobalStats,
  year: YearFilter,
): Promise<void> {
  const yearColRef = await getYearColRef(year);
  const docRef = doc(yearColRef, 'global').withConverter(globalStatsConverter);
  await setDoc(docRef, globalStats);
}

/**
 * Loads user statistics from Firestore for the specified year.
 * @param year The year to load from ('all_time' or a year number)
 * @returns Array of user statistics
 */
export async function loadUserStats(year: YearFilter): Promise<UserStats[]> {
  const yearColRef = (await getYearColRef(year)).withConverter(
    userStatsConverter,
  );
  const snapshot = await getDocs(yearColRef);

  return snapshot.docs
    .filter((doc) => doc.id !== 'global')
    .map((doc) => doc.data())
    .sort((a, b) => b.last_time_played!.getTime() - a.last_time_played!.getTime());
}

/**
 * Loads a specific user's statistics from Firestore for the specified year.
 * @param uid The user ID
 * @param year The year to load from ('all_time' or a year number)
 * @returns The user statistics or null if not found
 */
export async function loadUserStatsByUid(
  uid: string,
  year: YearFilter,
): Promise<UserStats | null> {
  const docRef = doc(await getYearColRef(year), uid).withConverter(
    userStatsConverter,
  );
  const snapshot = await getDoc(docRef);

  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Loads global statistics from Firestore for the specified year.
 * @param year The year to load from ('all_time' or a year number)
 * @returns The global statistics or null if not found
 */
export async function loadGlobalStats(
  year: YearFilter,
): Promise<GlobalStats | null> {
  const yearColRef = await getYearColRef(year);
  const docRef = doc(yearColRef, 'global').withConverter(globalStatsConverter);
  const snapshot = await getDoc(docRef);

  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Saves the user merge map to Firestore.
 * @param mergeMap The map of canonical UID to merged UIDs
 */
export async function saveUserMergeMap(mergeMap: UserMergeMap): Promise<void> {
  const batch = writeBatch(firestore);
  const mergedUsersRef = await getMergedUsersColRef();

  for (const [canonicalUid, mergedUids] of mergeMap.entries()) {
    const docRef = doc(mergedUsersRef, canonicalUid);
    batch.set(docRef, {
      canonical_uid: canonicalUid,
      merged_uids: mergedUids,
    });
  }

  await batch.commit();
}

/**
 * Loads the user merge map from Firestore.
 * @returns The user merge map
 */
export async function loadUserMergeMap(): Promise<UserMergeMap> {
  const mergedUsersRef = await getMergedUsersColRef();
  const snapshot = await getDocs(mergedUsersRef);

  const mergeMap = new UserMergeMap();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    mergeMap.set(data.canonical_uid, data.merged_uids);
  }

  return mergeMap;
}

/**
 * Deletes user statistics for a specific year.
 * @param year The year to delete ('all_time' or a year number)
 */
export async function deleteUserStatsForYear(year: YearFilter): Promise<void> {
  const yearColRef = await getYearColRef(year);
  const snapshot = await getDocs(yearColRef);

  const batch = writeBatch(firestore);
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }

  await batch.commit();
}

export async function deleteGlobalStatsForUser(
  uid: string,
  year: YearFilter,
): Promise<void> {
  const docRef = doc(statsRef, year.toString(), uid).withConverter(
    globalStatsConverter,
  );
  await deleteDoc(docRef);
}

/**
 * Deletes all user merge data.
 */
export async function deleteUserMergeMap(): Promise<void> {
  const mergedUsersRef = await getMergedUsersColRef();
  const snapshot = await getDocs(mergedUsersRef);

  const batch = writeBatch(firestore);
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }

  await batch.commit();
}
