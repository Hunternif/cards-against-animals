import firebaseConfig from '../firebase-config.json';
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, CollectionReference, doc } from 'firebase/firestore'
import { CAAUser, Deck, GameLobby } from './model/types';
import { deckConverter, lobbyConverter, turnConverter, userConverter } from './model/firebase-converters';
import { useCollection, useDocumentOnce } from 'react-firebase-hooks/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseApp = initializeApp(firebaseConfig)

// used for the firestore refs
const db = getFirestore(firebaseApp)
export const firebaseAuth = getAuth();

// here we can export reusable database references
export const decksRef = (collection(db, 'decks') as CollectionReference<Deck>)
    .withConverter(deckConverter)
export const lobbiesRef = (collection(db, 'lobbies') as CollectionReference<GameLobby>)
    .withConverter(lobbyConverter)
export const usersRef = (collection(db, 'users') as CollectionReference<CAAUser>)
    .withConverter(userConverter)

export function useGameTurns(lobby: GameLobby) {
    //TODO: should probably cache this collection instance
    const turnsRef = collection(lobbiesRef, lobby.id, 'turns')
        .withConverter(turnConverter);
    return useCollection(turnsRef);
}

export function useFetchCAAUser(email: string): CAAUser | undefined {
    // document IDs are email addresses
    const userDocRef = doc(usersRef, email);
    const [user] = useDocumentOnce(userDocRef);
    return user?.data();
}