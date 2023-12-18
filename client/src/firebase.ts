import firebaseConfig from '../../firebase-config.json';
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, connectFirestoreEmulator, collectionGroup } from 'firebase/firestore'
import { deckConverter, lobbyConverter, playerConverter, userConverter } from './model/firebase-converters';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { PromptCardInGame, ResponseCardInGame } from './shared/types';

export const firebaseApp = initializeApp(firebaseConfig)

// To enable emulator, set `"useEmulator": true ` in firebase-config.json
const useEmulator = (firebaseConfig as any)['useEmulator'] == true;

// used for the firestore refs
export const db = getFirestore(firebaseApp)
if (useEmulator) connectFirestoreEmulator(db, '127.0.0.1', 8080);

export const firebaseAuth = getAuth();
if (useEmulator) connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099');

// here we can export reusable database references
export const decksRef = collection(db, 'decks').withConverter(deckConverter)
export const lobbiesRef = collection(db, 'lobbies').withConverter(lobbyConverter)
export const usersRef = collection(db, 'users').withConverter(userConverter)
export const playersInGameRef = collectionGroup(db, 'players').withConverter(playerConverter);

export function useFetchCAAUser(uid: string) {
    // document IDs are user UIDs
    const userDocRef = doc(usersRef, uid);
    return useDocumentDataOnce(userDocRef);
}


// Functions
const functions = getFunctions(firebaseApp, firebaseConfig.region);
if (useEmulator) connectFunctionsEmulator(functions, '127.0.0.1', 5001);

export const findOrCreateLobbyFun = httpsCallable<
    { creator_uid: string }, { lobby_id: string }
>(functions, 'findOrCreateLobby');

export const joinLobbyFun = httpsCallable<
    { user_id: string, lobby_id: string }, void
>(functions, 'joinLobby');

export const findOrCreateLobbyAndJoinFun = httpsCallable<
    { user_id: string }, { lobby_id: string }
>(functions, 'findOrCreateLobbyAndJoin');

export const startLobbyFun = httpsCallable<
    { lobby_id: string }, void
>(functions, 'startLobby');

export const newTurnFun = httpsCallable<
    { lobby_id: string }, void
>(functions, 'newTurn');

export const endLobbyFun = httpsCallable<
    { lobby_id: string }, void
>(functions, 'endLobby');

export const logImpression = httpsCallable<
    {
        lobby_id: string,
        prompt: PromptCardInGame,
        responses: ResponseCardInGame[],
    }, void
>(functions, 'logImpression');