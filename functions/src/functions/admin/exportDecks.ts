import { assertAdmin } from '../../api/auth-api';
import { exportDecks } from '../../api/deck-export-api';
import { DeckExportData } from '../../shared/types';
import { CallableHandler } from '../function-utils';

/**
 * Exports all decks' content as JSON.
 */
export const exportDecksHandler: CallableHandler<void, DeckExportData> = async (
  event,
) => {
  assertAdmin(event);
  return await exportDecks();
};
