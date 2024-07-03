import { firestore } from '../firebase-server';
import { deckLockConverter } from '../shared/firestore-converters';
import { DeckLock } from '../shared/types';

function getDeckLockRef(deckID: string) {
  return firestore
    .collection('deck_locks')
    .withConverter(deckLockConverter)
    .doc(deckID);
}

function getUserDeckKeyRef(userID: string, deckID: string) {
  return firestore
    .collection(`users/${userID}/deck_keys`)
    .withConverter(deckLockConverter)
    .doc(deckID);
}

export async function getDeckLock(deckID: string): Promise<DeckLock | null> {
  return (await getDeckLockRef(deckID).get())?.data() ?? null;
}

export async function setDeckLock(lock: DeckLock) {
  await getDeckLockRef(lock.deck_id).set(lock);
}

export async function getUserDeckKey(
  userID: string,
  deckID: string,
): Promise<DeckLock | null> {
  return (await getUserDeckKeyRef(userID, deckID).get())?.data() ?? null;
}
