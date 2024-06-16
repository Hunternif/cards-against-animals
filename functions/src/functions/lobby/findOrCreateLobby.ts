import { assertLoggedIn } from '../../api/auth-api';
import {
  createLobby,
  findActiveLobbyWithPlayer,
} from '../../api/lobby-server-api';
import { CallableHandler } from '../function-utils';

/** Finds an existing active lobby for the user, or creates a new one. */
export const findOrCreateLobbyHandler: CallableHandler<
  { creator_uid: string },
  { lobby_id: string }
> = async (event) => {
  // await sleep(2000);
  assertLoggedIn(event);
  const creatorUID = event.data.creator_uid;
  // Find current active lobby for this user:
  const foundLobby = await findActiveLobbyWithPlayer(creatorUID);
  if (foundLobby) {
    return { lobby_id: foundLobby.id };
  }
  // Create a new lobby:
  const newLobby = await createLobby(creatorUID);
  return { lobby_id: newLobby.id };
};
