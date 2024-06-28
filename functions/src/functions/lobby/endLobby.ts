import { assertLobbyControl, assertLoggedIn } from '../../api/auth-api';
import { endLobby } from '../../api/lobby-server-api';
import { getLobby } from '../../api/lobby-server-repository';
import { CallableHandler } from '../function-utils';

/**
 * Ends current turn and sets lobby status to "ended".
 * This needs to be a cloud function to perform additional permission checks.
 */
export const endLobbyHandler: CallableHandler<
  { lobby_id: string },
  void
> = async (event) => {
  assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await assertLobbyControl(event, lobby);
  await endLobby(lobby);
};
