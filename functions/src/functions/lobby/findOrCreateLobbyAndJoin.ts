import { assertLoggedIn } from '../../api/auth-api';
import {
  addPlayer,
  createLobby,
  findActiveLobbyWithPlayer,
} from '../../api/lobby-server-api';
import { CallableHandler } from '../function-utils';

/** Combines `findOrCreateLobby` and `joinLobby` */
export const findOrCreateLobbyAndJoinHandler: CallableHandler<
  { user_id: string },
  { lobby_id: string }
> = async (event) => {
  // await sleep(2000);
  assertLoggedIn(event);
  const userID = event.data.user_id;
  const lobby =
    (await findActiveLobbyWithPlayer(userID)) ?? (await createLobby(userID));
  await addPlayer(lobby, userID);
  return { lobby_id: lobby.id };
};
