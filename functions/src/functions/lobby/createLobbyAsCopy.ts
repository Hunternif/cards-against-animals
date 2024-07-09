import { assertLobbyCreator, assertLoggedIn } from '../../api/auth-api';
import { createLobbyAsCopy } from '../../api/lobby-server-api';
import { getLobby } from '../../api/lobby-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Creates a new lobby by copying all settings and players from the given lobby.
 * Returns new lobby ID.
 */
export const createLobbyAsCopyHandler: CallableHandler<
  { old_lobby_id: string },
  { new_lobby_id: string }
> = async (event) => {
  // await sleep(2000);
  const userID = assertLoggedIn(event);
  const oldLobby = await getLobby(event.data.old_lobby_id);
  assertLobbyCreator(event, oldLobby);
  const newLobby = await createLobbyAsCopy(userID, oldLobby);
  return { new_lobby_id: newLobby.id };
};
