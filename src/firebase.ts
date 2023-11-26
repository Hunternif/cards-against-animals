import { initializeApp } from 'firebase/app'
import { getFirestore, collection, CollectionReference } from 'firebase/firestore'
import { Deck, GameLobby } from './model/types';
import { lobbyConverter } from './model/firebase-converters';

const firebaseConfig = {
    apiKey: "abcd",
    authDomain: "my-app.firebaseapp.com",
    databaseURL: "https://my-app-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-app",
    storageBucket: "my-app.appspot.com",
    messagingSenderId: "123456",
    appId: "1:2345:web:6789",
    measurementId: "A_BCDE123",
};

export const firebaseApp = initializeApp(firebaseConfig)

// used for the firestore refs
const db = getFirestore(firebaseApp)

// here we can export reusable database references
export const decksRef = collection(db, 'decks') as CollectionReference<Deck>
export const lobbiesRef = (collection(db, 'lobbies') as CollectionReference<GameLobby>)
    .withConverter(lobbyConverter)