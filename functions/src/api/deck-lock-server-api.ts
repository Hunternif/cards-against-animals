import { firestore } from '../firebase-server';
import { deckLockConverter } from '../shared/firestore-converters';
import { DeckLock } from '../shared/types';

// API for verifying access to locked decks.

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

async function getDeckLock(deckID: string): Promise<DeckLock | null> {
  return (await getDeckLockRef(deckID).get())?.data() ?? null;
}

async function getUserDeckKey(
  userID: string,
  deckID: string,
): Promise<DeckLock | null> {
  return (await getUserDeckKeyRef(userID, deckID).get())?.data() ?? null;
}

/** Returns true if the user has a matching key to the deck. */
export async function verifyUserHasDeckKey(
  userID: string,
  deckID: string,
): Promise<boolean> {
  const deckLock = await getDeckLock(deckID);
  if (deckLock == null) {
    // The deck doesn't have a lock
    return true;
  }
  const userKey = await getUserDeckKey(userID, deckID);
  if (userKey == null) return false;
  return deckLock.hash === userKey.hash;
}
