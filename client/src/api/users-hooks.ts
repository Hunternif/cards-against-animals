import {
  useDocumentData,
  useDocumentDataOnce,
} from 'react-firebase-hooks/firestore';
import { getCAAUserRef } from './users-api';

/** React hook to fetch user data and subscribe to it. */
export function useCAAUser(userID: string) {
  return useDocumentData(getCAAUserRef(userID));
}

/** React hook to fetch user data, without subscribing to it. */
export function useCAAUserOnce(userID: string) {
  return useDocumentDataOnce(getCAAUserRef(userID));
}
