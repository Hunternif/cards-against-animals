import { assertLoggedIn } from '../../api/auth-api';
import {
  addPlayer,
  createLobby,
  findActiveLobbyWithPlayer,
} from '../../api/lobby-server-api';
import { CallableHandler } from '../function-utils';

/** Finds an existing active lobby for the user, or creates a new one,
 * and joins as player. */
export const findOrCreateLobbyAndJoinHandler: CallableHandler<
  void,
  { lobby_id: string }
> = async (event) => {
  // await sleep(2000);
  const userID = assertLoggedIn(event);
  const lobby =
    (await findActiveLobbyWithPlayer(userID)) ?? (await createLobby(userID));
  await addPlayer(lobby, userID);
  return { lobby_id: lobby.id };
};
