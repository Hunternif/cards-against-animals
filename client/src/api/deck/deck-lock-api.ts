import { lockDeckFun, unlockDeckForUserFun } from '../../firebase';
import { Deck } from '../../shared/types';

// API for verifying access to locked decks.

/** Returns true if the user has a matching key to the deck. */
export async function verifyDeckKey(
  userID: string,
  deckID: string,
): Promise<boolean> {
  // TODO call cloud function
  return false;
}

/** Sets new password on the deck */
export async function lockDeck(deck: Deck, password: string) {
  await lockDeckFun({ deck_id: deck.id, password });
}

/** Unlocks the deck for this user, given the password. */
export async function unlockDeckForUser(
  deck: Deck,
  password: string,
): Promise<boolean> {
  const res = await unlockDeckForUserFun({ deck_id: deck.id, password });
  return res.data;
}
