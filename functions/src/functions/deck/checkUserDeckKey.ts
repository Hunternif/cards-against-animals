import { assertLoggedIn } from '../../api/auth-api';
import { verifyUserHasDeckKey } from '../../api/deck-lock-server-api';
import { CallableHandler } from '../function-utils';

/**
 * Returns true if the user has a valid password for this deck.
 */
export const checkUserDeckKeyHandler: CallableHandler<
  { deck_id: string },
  boolean
> = async (event) => {
  const userID = assertLoggedIn(event);
  const deckID = event.data.deck_id;
  return await verifyUserHasDeckKey(userID, deckID);
};
