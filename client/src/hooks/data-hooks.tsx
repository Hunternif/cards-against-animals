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
export function useAsyncData<T>(
  promise: Promise<T>,
): [data: T | null, error: any] {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    let active = true;
    awaitPromise();
    return () => {
      active = false;
    };

    async function awaitPromise() {
      try {
        setData(await promise);
      } catch (e: any) {
        setError(e);
      }
    }
  }, []); // Don't depend on identity of the promise!
  return [data, error];
}
