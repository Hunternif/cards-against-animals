import { assertLoggedIn } from '../../api/auth-api';
import { addPlayer } from '../../api/lobby-server-api';
import { getLobby } from '../../api/lobby-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobbyHandler: CallableHandler<
  { lobby_id: string },
  void
> = async (event) => {
  // await sleep(2000);
  const userID = assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await addPlayer(lobby, userID);
};
