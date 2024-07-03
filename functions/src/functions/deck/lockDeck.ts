import { logger } from 'firebase-functions/v1';
import { assertAdmin } from '../../api/auth-api';
import { createDeckLock } from '../../api/deck-lock-server-api';
import { getDeck, updateDeck } from '../../api/deck-server-api';
import { CallableHandler } from '../function-utils';

/**
 * Creates a 'lock' for this deck, so that it can only be used
 * with the the given password.
 */
export const lockDeckHandler: CallableHandler<
  { deck_id: string; password: string },
  void
> = async (event) => {
  await assertAdmin(event);
  const deckID = event.data.deck_id;
  await createDeckLock(deckID, event.data.password);
  // Set deck visibility to 'locked':
  const deck = await getDeck(deckID);
  deck.visibility = 'locked';
  await updateDeck(deck);
  logger.info(`Locked deck '${deckID}'`);
};
