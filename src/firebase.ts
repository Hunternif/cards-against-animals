import firebaseConfig from '../firebase-config.json';
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, CollectionReference } from 'firebase/firestore'
import { Deck, GameLobby } from './model/types';
import { deckConverter, lobbyConverter, turnConverter } from './model/firebase-converters';
import { useCollection } from 'react-firebase-hooks/firestore';
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

export function useGameTurns(lobby: GameLobby) {
    //TODO: should probably cache this collection instance
    const turnsRef = collection(lobbiesRef, lobby.id, 'turns')
        .withConverter(turnConverter);
    return useCollection(turnsRef);
}