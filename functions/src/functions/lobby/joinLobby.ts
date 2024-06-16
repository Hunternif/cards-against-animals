import { assertLoggedIn } from '../../api/auth-api';
import { addPlayer, getLobby } from '../../api/lobby-server-api';
import { CallableHandler } from '../function-utils';

/**
 * Will attempt to join as player. If the lobby is already in progress,
 * will join as spectator.
 */
export const joinLobbyHandler: CallableHandler<
  { user_id: string; lobby_id: string },
  void
> = async (event) => {
  // await sleep(2000);
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await addPlayer(lobby, event.data.user_id);
};
