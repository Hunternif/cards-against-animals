import { assertAdmin } from '../../api/auth-api';
import { exportDecks } from '../../api/deck-export-api';
import { CallableHandler } from '../function-utils';

/**
 * Exports all decks' content as JSON.
 */
export const exportDecksHandler: CallableHandler<void, string> = async (
  event,
) => {
  assertAdmin(event);
  return await exportDecks();
};
