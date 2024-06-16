import { DeckExportData } from '../shared/types';
import { downloadDeck, getDecksRef } from './deck-server-api';

/**
 * Serializes all decks' content into JSOn.
 */
export async function exportDecks(): Promise<DeckExportData> {
  const deckIDs = (await getDecksRef().get()).docs.map((d) => d.id);
  const decks = await Promise.all(deckIDs.map((id) => downloadDeck(id)));
  return {
    version: 1,
    date_created: new Date().toISOString(),
    decks,
  };
}
