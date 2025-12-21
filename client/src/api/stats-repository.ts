import {
  globalStatsConverter,
  userStatsConverter,
} from '@shared/firestore-converters';
import {
  GlobalStats,
  StatsContainer,
  UserMergeMap,
  UserStats,
  YearFilter,
  YearStats,
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

export const statsRef = collection(firestore, 'stats');
const usersMergeMapDocRef = doc(statsRef, 'merged_users');
export const usersMergeMapColRef = collection(usersMergeMapDocRef, 'users');

/** Returns Firestore collection reference for the specified year. */
export async function getYearColRef(year: YearFilter) {
  const docRef = doc(statsRef, year.toString());
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
    .sort(
      (a, b) => b.last_time_played!.getTime() - a.last_time_played!.getTime(),
    );
}

/**
 * Loads a specific user's statistics from Firestore for the specified year.
 * Resolves canonical user id.
 */
export async function loadCanonicalUserStats(
  uid: string,
  year: YearFilter,
  userMergeMap?: UserMergeMap,
): Promise<UserStats | null> {
  const mergeMap = userMergeMap ?? (await loadUserMergeMap());
  const canonicalUid = mergeMap.getCanonicalUid(uid);
  const docRef = doc(await getYearColRef(year), canonicalUid).withConverter(
    userStatsConverter,
  );
  return (await getDoc(docRef))?.data() ?? null;
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
  const rootDoc = await getDoc(usersMergeMapDocRef);
  if (!rootDoc.exists()) {
    await setDoc(usersMergeMapDocRef, {});
  }
  const batch = writeBatch(firestore);

  for (const [canonicalUid, mergedUids] of mergeMap.entries()) {
    const docRef = doc(usersMergeMapColRef, canonicalUid);
    batch.set(docRef, {
      canonical_uid: canonicalUid,
      merged_uids: mergedUids,
    });
  }

  await batch.commit();
}

/** Loads the user merge map from Firestore. */
export async function loadUserMergeMap(): Promise<UserMergeMap> {
  const snapshot = await getDocs(usersMergeMapColRef);

  const mergeMap = new UserMergeMap();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    mergeMap.loadMergedGroup(data.canonical_uid, data.merged_uids);
  }

  return mergeMap;
}

/** Loads the available years that have stats data in Firestore. */
export async function loadAvailableYears(): Promise<YearFilter[]> {
  const snapshot = await getDocs(statsRef);
  const years: YearFilter[] = [];

  for (const doc of snapshot.docs) {
    const yearStr = doc.id;
    // Skip non-year documents
    if (yearStr === 'merged_users') continue;
    if (yearStr === 'all_time') years.push('all_time');

    const year = parseInt(yearStr);
    if (!isNaN(year)) {
      years.push(year);
    }
  }

  return years.sort((a, b) => b.toString().localeCompare(a.toString()));
}

/** Loads all stats from Firestore */
export async function loadAllStats(): Promise<StatsContainer> {
  const userMergeMap = await loadUserMergeMap();
  const years = await loadAvailableYears();
  const yearMap = new Map<YearFilter, YearStats>();
  for (const year of years) {
    yearMap.set(year, await loadStatsFromYear(year));
  }
  return new StatsContainer(yearMap, userMergeMap);
}

const emptyGlobalStats: GlobalStats = {
  total_games: 0,
  total_turns: 0,
  unique_players: 0,
  total_time_played_ms: 0,
  median_time_per_game_ms: 0,
  median_players_per_game: 0,
  median_turns_per_game: 0,
  top_prompts: [],
  top_response_cards: [],
  top_liked_responses: [],
  top_decks: [],
  top_months: [],
};

/** Loads all stats (user stats, global stats) from Firestore. */
export async function loadStatsFromYear(year: YearFilter): Promise<YearStats> {
  const [userStats, globalStats] = await Promise.all([
    loadUserStats(year),
    loadGlobalStats(year),
  ]);
  return { year, userStats, globalStats: globalStats ?? emptyGlobalStats };
}

/** Saves stats in firestore */
export async function saveAllStats(statsContainer: StatsContainer) {
  await saveUserMergeMap(statsContainer.userMergeMap);
  for (const [year, stats] of statsContainer.yearMap) {
    await saveGlobalStats(stats.globalStats, year);
    await saveUserStats(stats.userStats, year);
    // delete any obsolete user stat that was merged in:
    const colRef = await getYearColRef(year);
    const savedUsers = (await getDocs(colRef)).docs.map((d) => d.id);
    const expectedUsers = stats.userStats.map((u) => u.uid);
    for (const uid of savedUsers) {
      if (uid !== 'global' && !expectedUsers.includes(uid)) {
        await deleteDoc(doc(colRef, uid));
        console.log(`Deleted stats for user ${uid}`);
      }
    }
  }
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
  const snapshot = await getDocs(usersMergeMapColRef);

  const batch = writeBatch(firestore);
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }

  await batch.commit();
}
