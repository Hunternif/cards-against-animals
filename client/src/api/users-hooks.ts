import {
  useCollection,
  useDocumentData,
  useDocumentDataOnce,
} from 'react-firebase-hooks/firestore';
import { FirestoreCollectionDataHookNullSafe } from '../hooks/data-hooks';
import { getCAAUserRef, getUserDeckLocksRef } from './users-api';

/** React hook to fetch user data and subscribe to it. */
export function useCAAUser(userID: string) {
  return useDocumentData(getCAAUserRef(userID));
}

/** React hook to fetch user data, without subscribing to it. */
export function useCAAUserOnce(userID: string) {
  return useDocumentDataOnce(getCAAUserRef(userID));
}

/** Returns a list of deck IDs for which the player _should have_ keys. */
export function useUserDecksWithKeys(
  userID: string,
): FirestoreCollectionDataHookNullSafe<string> {
  const [docs, loading, error] = useCollection(getUserDeckLocksRef(userID));
  const ids = docs?.docs.map((d) => d.id) ?? [];
  return [ids, loading, error];
}
