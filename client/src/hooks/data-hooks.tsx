import {
  DocumentReference,
  DocumentSnapshot,
  CollectionReference,
  FirestoreError,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';
import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useCollectionData,
  useDocumentData,
} from 'react-firebase-hooks/firestore';
import { useErrorContext } from '../components/ErrorContext';

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
export type FirestorDocumentDataHook<T> = [
  value: T | undefined,
  loading: boolean,
  error?: FirestoreError,
  snapshot?: DocumentSnapshot<T>,
];
export type FirestorDocumentDataHookNullSafe<T> = [
  value: T,
  loading: boolean,
  error?: FirestoreError,
  snapshot?: DocumentSnapshot<T>,
];

/**
 * Same as Firestore useCollectionData, but the returned collection is non-null.
 * Also prevents showing stale data when the query changes.
 */
export function useCollectionDataNonNull<T>(
  query: CollectionReference<T>,
): FirestoreCollectionDataHookNullSafe<T> {
  // Track the query path for which we last accepted data
  const [acceptedQueryPath, setAcceptedQueryPath] = useState(query.path);
  const [items, setItems] = useState<T[]>([]);
  
  const [data, loading, error, snapshot] = useCollectionData(query);
  
  useEffect(() => {
    if (query.path !== acceptedQueryPath) {
      // Query changed, reset items and accepted path
      setAcceptedQueryPath(query.path);
      setItems([]);
    } else if (data && data.length > 0) {
      // Only update items for the current query
      setItems(data);
    }
  }, [query.path, acceptedQueryPath, data]);
  
  // If query changed but state hasn't updated yet, return empty array immediately
  if (query.path !== acceptedQueryPath) {
    return [[], loading, error, snapshot];
  }
  
  return [items, loading, error, snapshot];
}

/** Same as Firestore useDocumentData, but returns a default value if undefined. */
export function useDocumentDataOrDefault<T>(
  query: DocumentReference<T>,
  defaultValue: T,
): FirestorDocumentDataHookNullSafe<T> {
  const [data, loading, error, snapshot] = useDocumentData(query);
  return [data || defaultValue, loading, error, snapshot];
}

export function useDocumentDataWithCache<T>(
  query: DocumentReference<T>,
  initialValue: T,
): FirestorDocumentDataHookNullSafe<T> {
  const cache = useRef<T>(initialValue); // Keep cached value across renders
  const [_, setDataToForceRerender] = useState<T>(initialValue);
  const [data, loading, error, snapshot] = useDocumentData(query);
  useEffect(() => {
    if (data) {
      setDataToForceRerender(data);
      cache.current = data;
    }
  }, [data]);
  return [cache.current, loading, error, snapshot];
}

/** Convenience hook to get async data. */
export function useAsyncData<T>(
  promise: Promise<T>,
): [data: T | null, loading: boolean, error: any] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    let active = true;
    awaitPromise();
    return () => {
      active = false;
    };

    async function awaitPromise() {
      try {
        setLoading(true);
        setData(await promise);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    }
  }, []); // Don't depend on identity of the promise!
  return [data, loading, error];
}

/**
 * Convenience hook to maintain a set of items which can be
 * marked on and off.
 * Useful e.g. for maintaing a 'selected' subset of some collection.
 */
export function useMarkedData<T>(): [
  markedData: Set<T>,
  markItem: (item: T) => void,
  unmarkItem: (item: T) => void,
] {
  const [markedData, setMarkedData] = useState<Set<T>>(new Set());
  const markItem = useCallback(
    (item: T) => {
      setMarkedData(new Set(markedData).add(item));
    },
    [markedData],
  );
  const unmarkItem = useCallback(
    (item: T) => {
      const newMarkedData = new Set(markedData);
      newMarkedData.delete(item);
      setMarkedData(newMarkedData);
    },
    [markedData],
  );
  return [markedData, markItem, unmarkItem];
}

/**
 * Convenience hook to run async handler on a button click,
 * with error handling and loading state.
 */
export function useHandler<V>(
  callback: () => Promise<V>,
  deps: DependencyList,
): [handler: () => Promise<V | undefined>, loading: boolean] {
  const { setError } = useErrorContext();
  const [loading, setLoading] = useState(false);

  const handler = useCallback(async () => {
    try {
      setLoading(true);
      return await callback();
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, deps);
  return [handler, loading];
}

/**
 * Convenience hook to run async handler on a button click,
 * with error handling and loading state. With 1 argument.
 */
export function useHandler1<T, V>(
  callback: (arg1: T) => Promise<V>,
  deps: DependencyList,
): [handler: (arg1: T) => Promise<V | undefined>, loading: boolean] {
  const { setError } = useErrorContext();
  const [loading, setLoading] = useState(false);

  const handler = useCallback(async (arg1: T) => {
    try {
      setLoading(true);
      return await callback(arg1);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, deps);
  return [handler, loading];
}

/**
 * Convenience hook to run async handler on a button click,
 * with error handling and loading state. With 2 arguments.
 * WARNING: parameters passed here are saved in the closure!
 */
export function useHandler2<T, U, V>(
  callback: (arg1: T, arg2: U) => Promise<V>,
  deps: DependencyList,
): [handler: (arg1: T, arg2: U) => Promise<V | undefined>, loading: boolean] {
  const { setError } = useErrorContext();
  const [loading, setLoading] = useState(false);

  const handler = useCallback(async (arg1: T, arg2: U) => {
    try {
      setLoading(true);
      return await callback(arg1, arg2);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, deps);
  return [handler, loading];
}
