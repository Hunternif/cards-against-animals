import firebaseConfig from '../../firebase-config.json';
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, CollectionReference, doc, connectFirestoreEmulator } from 'firebase/firestore'
import { CAAUser, Deck, GameLobby } from './model/types';
import { deckConverter, lobbyConverter, userConverter } from './model/firebase-converters';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

export const firebaseApp = initializeApp(firebaseConfig)

// used for the firestore refs
export const db = getFirestore(firebaseApp)
// connectFirestoreEmulator(db, '127.0.0.1', 8080);

export const firebaseAuth = getAuth();
// connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099');

// here we can export reusable database references
export const decksRef = (collection(db, 'decks') as CollectionReference<Deck>)
    .withConverter(deckConverter)
export const lobbiesRef = (collection(db, 'lobbies') as CollectionReference<GameLobby>)
    .withConverter(lobbyConverter)
export const usersRef = (collection(db, 'users') as CollectionReference<CAAUser>)
    .withConverter(userConverter)

export function useFetchCAAUser(uid: string) {
    // document IDs are user UIDs
    const userDocRef = doc(usersRef, uid);
    return useDocumentDataOnce(userDocRef);
}


// Functions
const functions = getFunctions(firebaseApp, firebaseConfig.region);
// connectFunctionsEmulator(functions, '127.0.0.1', 5001);

export const helloWorld = httpsCallable(functions, 'helloWorld');