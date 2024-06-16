import { saveAs } from 'file-saver';
import { IDeckRepository } from './deck-repository';

/**
 * Downloads deck data from the server and saves it as a local file.
 */
export async function exportDecksToFile(repo: IDeckRepository) {
  repo.clearCache();
  const decks = await repo.getDecks();
  const completeDecks = await Promise.all(
    decks.map((d) => repo.downloadDeck(d.id)),
  );
  const exportData = {
    version: 1,
    date_created: new Date().toISOString(),
    decks: completeDecks,
  };

  const blob = new Blob([JSON.stringify(exportData, null, '  ')], {
    type: 'application/json',
  });
  saveAs(blob, `caa_decks_${exportData.date_created}.json`);
}
