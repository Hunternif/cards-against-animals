import { HttpsError } from 'firebase-functions/v1/auth';
import { DeckLock } from '../shared/types';
import {
  getDeckLock,
  getUserDeckKey,
  setDeckLock,
} from './deck-lock-repository';

// API for verifying access to locked decks.

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

/** Returns true if the passsword matches. */
export async function verifyDeckPassword(
  deckID: string,
  password: string,
): Promise<boolean> {
  const deckLock = await getDeckLock(deckID);
  if (deckLock == null) {
    // The deck doesn't have a lock
    return true;
  }
  const hash = await hashDeckKey(deckLock.deck_id, password);
  return deckLock.hash === hash;
}

/** Sets a password on a deck. Only allowed for admins */
export async function createDeckLock(deckID: string, password: string) {
  const existingLock = await getDeckLock(deckID);
  if (existingLock)
    throw new HttpsError(
      'failed-precondition',
      `Deck '${deckID}' already has a lock`,
    );
  const hash = await hashDeckKey(deckID, password);
  await setDeckLock(new DeckLock(deckID, hash));
}

/** Creates a one-way hash for a deck password. */
export async function hashDeckKey(
  deckID: string,
  password: string,
): Promise<string> {
  // deckID is the salt
  return await sha256(password + deckID);
}

/** https://stackoverflow.com/a/48161723/1093712 */
async function sha256(message: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
