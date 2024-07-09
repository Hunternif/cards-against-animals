import { assertLoggedIn } from '../../api/auth-api';
import { changePlayerRole } from '../../api/lobby-server-api';
import { getLobby } from '../../api/lobby-server-repository';
import { PlayerRole } from '../../shared/types';
import { CallableHandler } from '../function-utils';

/**
 * Will attempt to change player role.
 * Can only become 'player' if player limit is not exceeded.
 */
export const changePlayerRoleHandler: CallableHandler<
  { lobby_id: string; role: PlayerRole },
  void
> = async (event) => {
  // await sleep(2000);
  const userID = assertLoggedIn(event);
  const lobby = await getLobby(event.data.lobby_id);
  await changePlayerRole(lobby, userID, event.data.role);
};
