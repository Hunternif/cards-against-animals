import { useCollectionData } from 'react-firebase-hooks/firestore';
import { usersMergeMapColRef } from './stats-repository';
import { useEffect, useState } from 'react';
import { UserMergeMap } from '../../../shared/src/user-merge-map';
import { FirestorDocumentDataHook, useHandler1 } from '../hooks/data-hooks';
import { DocumentData } from 'firebase/firestore';

export function useUsersMergeMap(): FirestorDocumentDataHook<UserMergeMap> {
  const [mergeMapUsers, loading, error] =
    useCollectionData(usersMergeMapColRef);
  const [mergeMap, setMergeMap] = useState<UserMergeMap | undefined>(undefined);

  const [parseMergeMap, parsing] = useHandler1(
    async (userData: DocumentData[]) => {
      const newMap = new UserMergeMap();
      for (const user of userData) {
        newMap.loadMergedGroup(user.canonical_uid, user.merged_uids);
      }
      setMergeMap(newMap);
    },
    [],
  );

  useEffect(() => {
    if (mergeMapUsers) {
      parseMergeMap(mergeMapUsers);
    }
  }, [mergeMapUsers]);

  return [mergeMap, loading || parsing, error];
}
