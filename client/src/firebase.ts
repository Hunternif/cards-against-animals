import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  collection,
  collectionGroup,
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore';
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import firebaseConfig from '../../firebase-config.json';
import {
  KickAction,
  LobbySettings,
  PromptCardInGame,
  ResponseCardInGame,
} from './shared/types';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

const firebaseApp = initializeApp(firebaseConfig);

// To enable emulator, set `"useEmulator": true ` in firebase-config.json
const useEmulator = (firebaseConfig as any)['useEmulator'] == true;

// used for the firestore refs
export const firestore = getFirestore(firebaseApp);
if (useEmulator) connectFirestoreEmulator(firestore, '127.0.0.1', 8080);

export const firebaseAuth = getAuth();
if (useEmulator) connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099');

export const database = getDatabase(firebaseApp);
if (useEmulator) connectDatabaseEmulator(database, '127.0.0.1', 9000);

// Functions
const functions = getFunctions(firebaseApp, firebaseConfig.region);
if (useEmulator) connectFunctionsEmulator(functions, '127.0.0.1', 5001);

export const findOrCreateLobbyFun = httpsCallable<
  { creator_uid: string },
  { lobby_id: string }
>(functions, 'findOrCreateLobby');

export const joinLobbyFun = httpsCallable<
  { user_id: string; lobby_id: string },
  void
>(functions, 'joinLobby');

export const findOrCreateLobbyAndJoinFun = httpsCallable<
  { user_id: string },
  { lobby_id: string }
>(functions, 'findOrCreateLobbyAndJoin');

export const startLobbyFun = httpsCallable<{ lobby_id: string }, void>(
  functions,
  'startLobby',
);

export const updateLobbySettingsFun = httpsCallable<
  { lobby_id: string; settings: LobbySettings },
  void
>(functions, 'updateLobbySettings');

export const kickPlayerFun = httpsCallable<
  { lobby_id: string; user_id: string; action: KickAction },
  void
>(functions, 'kickPlayer');

export const newTurnFun = httpsCallable<
  { lobby_id: string; current_turn_id: string },
  void
>(functions, 'newTurn');

export const endLobbyFun = httpsCallable<{ lobby_id: string }, void>(
  functions,
  'endLobby',
);

export const discardNowFun = httpsCallable<{ lobby_id: string }, void>(
  functions,
  'discardNow',
);

export const logInteractionFun = httpsCallable<
  {
    lobby_id: string;
    viewed_prompts: PromptCardInGame[];
    viewed_responses: ResponseCardInGame[];
    played_prompts: PromptCardInGame[];
    played_responses: ResponseCardInGame[];
    discarded_prompts: PromptCardInGame[];
    discarded_responses: ResponseCardInGame[];
    won_responses: ResponseCardInGame[];
  },
  void
>(functions, 'logInteraction');
