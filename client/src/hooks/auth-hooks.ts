import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database';
import { useEffect } from 'react';
import { AuthStateHook, useAuthState } from 'react-firebase-hooks/auth';
import { useErrorContext } from '../components/ErrorContext';
import { database, firebaseAuth } from '../firebase';
import { DBPresenceToWrite } from '../shared/types';

const isOfflineForDB: DBPresenceToWrite = {
  state: 'offline',
  last_changed: serverTimestamp(),
};

const isOnlineForDB: DBPresenceToWrite = {
  state: 'online',
  last_changed: serverTimestamp(),
};

/** Special path in Firebase RTDB that returns 'true' when connected. */
const connectedDBRef = ref(database, '.info/connected');

/**
 * Provides Firebase's auth state and also enables online presence.
 * See https://firebase.google.com/docs/firestore/solutions/presence
 *
 * Not implementing local offline state for now.
 */
export function useAuthWithPresence(): AuthStateHook {
  const [user, loading, error] = useAuthState(firebaseAuth);
  const { setError } = useErrorContext();

  useEffect(() => {
    if (user) {
      // This user's status node:
      const userStatusDBRef = ref(database, `/status/${user.uid}`);

      // (Returns usubscribe callback)
      return onValue(connectedDBRef, async (snapshot) => {
        if (snapshot.val() == false) return; // not connected

        try {
          // When we disconnect, the server will use set object in the DB:
          await onDisconnect(userStatusDBRef).set(isOfflineForDB);

          // Now we can safely set ourselves as 'online':
          set(userStatusDBRef, isOnlineForDB);
        } catch (e: any) {
          setError(e);
        }
      });
    }
  }, [user]);

  return [user, loading, error];
}
