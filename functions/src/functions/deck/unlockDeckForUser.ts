import { assertLoggedIn } from '../../api/auth-api';
import { setUserDeckKey } from '../../api/deck-lock-repository';
import { verifyDeckPassword } from '../../api/deck-lock-server-api';
import { sleep } from '@shared/utils';
import { CallableHandler } from '../function-utils';

/**
 * If the password matches, saves it for this user, and returns true.
 * Otherwise returns false.
 */
export const unlockDeckForUserHandler: CallableHandler<
  { deck_id: string; password: string },
  boolean
> = async (event) => {
  const userID = assertLoggedIn(event);
  const { deck_id, password } = event.data;
  await sleep(1000); // Sleep for extra slowness.
  if (await verifyDeckPassword(deck_id, password)) {
    await setUserDeckKey(userID, deck_id, password);
    return true;
  }
  return false;
};
