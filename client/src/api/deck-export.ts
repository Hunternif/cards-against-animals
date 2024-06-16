import { exportDecksFun } from '../firebase';
import { saveAs } from 'file-saver';

/**
 * Downloads deck data from the server and saves it as a local file.
 */
export async function exportDecksToFile() {
  const data = (await exportDecksFun()).data;
  const blob = new Blob([JSON.stringify(data, null, '  ')], {
    type: 'application/json',
  });
  saveAs(blob, `caa_decks_${data.date_created}.json`);
}
