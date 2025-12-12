/**
 * Maps canonical UID to a list of all UIDs that should be merged into it.
 * The canonical UID should also be included in the list.
 */
export class UserMergeMap {
  private primaryToMerged = new Map<string, string[]>();
  private mergedToPrimary = new Map<string, string>();

  constructor() {}

  static from(otherMap: UserMergeMap): UserMergeMap {
    const newMap = new UserMergeMap();
    for (const [uid, mergedUids] of otherMap.entries()) {
      newMap.loadMergedGroup(uid, mergedUids);
    }
    return newMap;
  }

  /** For fetching from Firestore */
  loadMergedGroup(primaryUid: string, mergedUids: string[]) {
    this.primaryToMerged.set(primaryUid, [...mergedUids]);
    for (const uid of mergedUids) {
      this.mergedToPrimary.set(uid, primaryUid);
    }
  }

  mergeUser(primaryUid: string, mergedUids: Iterable<string>) {
    const totalUids = new Set<string>(this.primaryToMerged.get(primaryUid));
    totalUids.add(primaryUid);
    for (const uid of mergedUids) {
      const otherPrimary = this.mergedToPrimary.get(uid);
      if (otherPrimary) {
        totalUids.add(otherPrimary);
      }
      totalUids.add(uid);
      const secondaryMergedUids = this.primaryToMerged.get(uid) ?? [];
      for (const uid2 of secondaryMergedUids) {
        totalUids.add(uid2);
      }
    }
    // apply the merge:
    for (const uid of totalUids) {
      this.primaryToMerged.delete(uid);
      this.mergedToPrimary.set(uid, primaryUid);
    }
    this.primaryToMerged.set(primaryUid, Array.from(totalUids));
  }

  /**
   * Gets the canonical UID for a given UID.
   * If the UID is part of a merged group, returns the canonical UID.
   * Otherwise, returns the original UID.
   */
  getCanonicalUid(uid: string): string {
    return this.mergedToPrimary.get(uid) ?? uid;
  }

  getMergedUids(primaryUid: string): string[] {
    return this.primaryToMerged.get(primaryUid) ?? [];
  }

  /**
   * Returns an iterator of [canonicalUid, mergedUids] entries.
   */
  entries(): IterableIterator<[string, string[]]> {
    return this.primaryToMerged.entries();
  }
}
