import { FirestoreError, Query, QuerySnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';

export type FirestoreCollectionDataHook<T> = [
  value: T[] | undefined,
  loading: boolean,
  error?: FirestoreError,
  snapshot?: QuerySnapshot<T>,
];
export type FirestoreCollectionDataHookNullSafe<T> = [
  value: T[],
  loading: boolean,
  error?: FirestoreError,
  snapshot?: QuerySnapshot<T>,
];

/** Same as Firestore useCollectionData, but the returned collection is non-null. */
export function useCollectionDataNonNull<T>(
  query?: Query<T>,
): FirestoreCollectionDataHookNullSafe<T> {
  const [data, loading, error, snapshot] = useCollectionData(query);
  return [data || [], loading, error, snapshot];
}

/** Convenience hook to get async data. */
export function useAsyncData<T>(fn: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    fn()
      .then((result) => setData(result))
      .catch((e: any) => setError(e));
  }, [fn]);
  if (error) throw error;
  return data;
}
