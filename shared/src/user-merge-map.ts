/**
 * Maps canonical UID to a list of all UIDs that should be merged into it.
 * The canonical UID should also be included in the list.
 */
export class UserMergeMap {
  private map: Map<string, string[]>;

  constructor(entries?: Iterable<[string, string[]]>) {
    this.map = new Map(entries);
  }

  /**
   * Gets the canonical UID for a given UID.
   * If the UID is part of a merged group, returns the canonical UID.
   * Otherwise, returns the original UID.
   */
  getCanonicalUid(uid: string): string {
    for (const [canonicalUid, mergedUids] of this.map.entries()) {
      if (mergedUids.includes(uid)) {
        return canonicalUid;
      }
    }
    return uid;
  }

  /**
   * Merges multiple UIDs into a single canonical UID.
   * @param canonicalUid The primary UID that will represent the merged group
   * @param uidsToMerge All UIDs to merge (including the canonical UID)
   */
  set(canonicalUid: string, uidsToMerge: string[]): void {
    this.map.set(canonicalUid, uidsToMerge);
  }

  /**
   * Returns an iterator of [canonicalUid, mergedUids] entries.
   */
  entries(): IterableIterator<[string, string[]]> {
    return this.map.entries();
  }

  /**
   * Returns the number of merge groups.
   */
  get size(): number {
    return this.map.size;
  }
}
