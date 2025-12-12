import { UserMergeMap } from '@shared/user-merge-map';

describe('UserMergeMap', () => {
  describe('constructor', () => {
    test('creates an empty map', () => {
      const map = new UserMergeMap();
      expect(map.getCanonicalUid('user1')).toBe('user1');
      expect(map.getMergedUids('user1')).toEqual([]);
    });
  });

  describe('from', () => {
    test('creates a copy of another map', () => {
      const original = new UserMergeMap();
      original.loadMergedGroup('primary1', ['primary1', 'merged1', 'merged2']);
      original.loadMergedGroup('primary2', ['primary2', 'merged3']);
      expect(original.getCanonicalUid('merged1')).toBe('primary1');
      expect(original.getCanonicalUid('merged2')).toBe('primary1');
      expect(original.getCanonicalUid('merged3')).toBe('primary2');
      expect(original.getMergedUids('primary1')).toEqual([
        'primary1',
        'merged1',
        'merged2',
      ]);
      expect(original.getMergedUids('primary2')).toEqual([
        'primary2',
        'merged3',
      ]);

      const copy = UserMergeMap.from(original);

      expect(copy.getCanonicalUid('merged1')).toBe('primary1');
      expect(copy.getCanonicalUid('merged2')).toBe('primary1');
      expect(copy.getCanonicalUid('merged3')).toBe('primary2');
      expect(copy.getMergedUids('primary1')).toEqual([
        'primary1',
        'merged1',
        'merged2',
      ]);
      expect(copy.getMergedUids('primary2')).toEqual(['primary2', 'merged3']);
    });

    test('creates independent copy (mutations do not affect original)', () => {
      const original = new UserMergeMap();
      original.loadMergedGroup('primary1', ['primary1', 'merged1']);

      const copy = UserMergeMap.from(original);
      copy.mergeUser('primary1', ['merged2']);

      expect(original.getCanonicalUid('merged2')).toBe('merged2');
      expect(copy.getCanonicalUid('merged2')).toBe('primary1');
    });
  });

  describe('loadMergedGroup', () => {
    test('loads a single merged group', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary', ['primary', 'merged1', 'merged2']);

      expect(map.getCanonicalUid('primary')).toBe('primary');
      expect(map.getCanonicalUid('merged1')).toBe('primary');
      expect(map.getCanonicalUid('merged2')).toBe('primary');
      expect(map.getMergedUids('primary')).toEqual([
        'primary',
        'merged1',
        'merged2',
      ]);
    });

    test('loads multiple independent merged groups', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary1', ['primary1', 'merged1']);
      map.loadMergedGroup('primary2', ['primary2', 'merged2', 'merged3']);

      expect(map.getCanonicalUid('merged1')).toBe('primary1');
      expect(map.getCanonicalUid('merged2')).toBe('primary2');
      expect(map.getCanonicalUid('merged3')).toBe('primary2');
    });

    test('handles empty merged group', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary', []);

      expect(map.getCanonicalUid('primary')).toBe('primary');
      expect(map.getMergedUids('primary')).toEqual([]);
    });
  });

  describe('mergeUser', () => {
    test('merges a single user into primary', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', ['merged1']);

      expect(map.getCanonicalUid('primary')).toBe('primary');
      expect(map.getCanonicalUid('merged1')).toBe('primary');
      expect(map.getMergedUids('primary')).toEqual(['primary', 'merged1']);
    });

    test('merges multiple users into primary', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', ['merged1', 'merged2', 'merged3']);

      expect(map.getCanonicalUid('merged1')).toBe('primary');
      expect(map.getCanonicalUid('merged2')).toBe('primary');
      expect(map.getCanonicalUid('merged3')).toBe('primary');

      const mergedUids = map.getMergedUids('primary');
      expect(mergedUids).toEqual(['primary', 'merged1', 'merged2', 'merged3']);
    });

    test('merges existing merged groups together', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary1', ['primary1', 'merged1']);
      map.loadMergedGroup('primary2', ['primary2', 'merged2']);

      // Merge primary2 group into primary1
      map.mergeUser('primary1', ['primary2']);

      expect(map.getCanonicalUid('merged1')).toBe('primary1');
      expect(map.getCanonicalUid('merged2')).toBe('primary1');
      expect(map.getCanonicalUid('primary2')).toBe('primary1');

      const mergedUids = map.getMergedUids('primary1');
      expect(mergedUids).toEqual([
        'primary1',
        'merged1',
        'primary2',
        'merged2',
      ]);
    });

    test('merges multiple existing groups together', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary1', ['primary1', 'merged1']);
      map.loadMergedGroup('primary2', ['primary2', 'merged2']);
      map.loadMergedGroup('primary3', ['primary3', 'merged3']);

      map.mergeUser('primary1', ['primary2', 'primary3']);

      expect(map.getCanonicalUid('merged1')).toBe('primary1');
      expect(map.getCanonicalUid('merged2')).toBe('primary1');
      expect(map.getCanonicalUid('merged3')).toBe('primary1');
      expect(map.getCanonicalUid('primary2')).toBe('primary1');
      expect(map.getCanonicalUid('primary3')).toBe('primary1');

      const mergedUids = map.getMergedUids('primary1');
      expect(mergedUids).toEqual([
        'primary1',
        'merged1',
        'primary2',
        'merged2',
        'primary3',
        'merged3',
      ]);
    });

    test('removes old primary entries after merge', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary1', ['primary1', 'merged1']);
      map.loadMergedGroup('primary2', ['primary2', 'merged2']);

      map.mergeUser('primary1', ['primary2']);

      // primary2 should no longer have its own merged group
      expect(map.getMergedUids('primary2')).toEqual([]);
    });

    test('handles merging with empty iterable', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', []);

      expect(map.getCanonicalUid('primary')).toBe('primary');
      expect(map.getMergedUids('primary')).toEqual(['primary']);
    });

    test('is idempotent when merging same users', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', ['merged1', 'merged2']);
      map.mergeUser('primary', ['merged1', 'merged2']);

      const mergedUids = map.getMergedUids('primary');
      expect(mergedUids).toEqual(['primary', 'merged1', 'merged2']);
    });

    test('handles complex merge chain', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary1', ['merged1']);
      map.mergeUser('primary2', ['merged2']);
      map.mergeUser('primary1', ['primary2']); // This should merge all 4 users

      expect(map.getCanonicalUid('primary1')).toBe('primary1');
      expect(map.getCanonicalUid('primary2')).toBe('primary1');
      expect(map.getCanonicalUid('merged1')).toBe('primary1');
      expect(map.getCanonicalUid('merged2')).toBe('primary1');

      const mergedUids = map.getMergedUids('primary1');
      expect(mergedUids).toEqual([
        'primary1',
        'merged1',
        'primary2',
        'merged2',
      ]);
    });
  });

  describe('entries', () => {
    test('returns empty iterator for empty map', () => {
      const map = new UserMergeMap();
      const entries = Array.from(map.entries());
      expect(entries).toEqual([]);
    });

    test('returns all primary to merged mappings', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary1', ['primary1', 'merged1', 'merged2']);
      map.loadMergedGroup('primary2', ['primary2', 'merged3']);

      const entries = Array.from(map.entries());
      expect(entries).toHaveLength(2);

      const entriesMap = new Map(entries);
      expect(entriesMap.get('primary1')).toEqual([
        'primary1',
        'merged1',
        'merged2',
      ]);
      expect(entriesMap.get('primary2')).toEqual(['primary2', 'merged3']);
    });

    test('iterator can be used multiple times', () => {
      const map = new UserMergeMap();
      map.loadMergedGroup('primary', ['primary', 'merged']);

      const entries1 = Array.from(map.entries());
      const entries2 = Array.from(map.entries());

      expect(entries1).toEqual(entries2);
    });
  });

  describe('edge cases', () => {
    test('handles self-referential merge', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', ['primary']);

      expect(map.getCanonicalUid('primary')).toBe('primary');
      expect(map.getMergedUids('primary')).toEqual(['primary']);
    });

    test('handles merging same user multiple times in one call', () => {
      const map = new UserMergeMap();
      map.mergeUser('primary', ['merged1', 'merged1', 'merged1']);

      const mergedUids = map.getMergedUids('primary');
      expect(mergedUids).toEqual(['primary', 'merged1']);
    });

    test('preserves data after multiple operations', () => {
      const map = new UserMergeMap();

      // Build up a complex merge structure
      map.loadMergedGroup('A', ['A', 'A1', 'A2']);
      map.loadMergedGroup('B', ['B', 'B1']);
      map.loadMergedGroup('C', ['C', 'C1', 'C2', 'C3']);

      map.mergeUser('A', ['B']); // Merge B into A
      map.mergeUser('D', ['D1', 'D2']);
      map.mergeUser('A', ['C', 'D']); // Merge C and D into A

      // All users should now point to A
      const allUsers = [
        'A',
        'A1',
        'A2',
        'B',
        'B1',
        'C',
        'C1',
        'C2',
        'C3',
        'D',
        'D1',
        'D2',
      ];
      for (const user of allUsers) {
        expect(map.getCanonicalUid(user)).toBe('A');
      }

      const mergedUids = map.getMergedUids('A');
      expect(mergedUids).toHaveLength(12);
      for (const user of allUsers) {
        expect(mergedUids).toContain(user);
      }
    });
  });
});
