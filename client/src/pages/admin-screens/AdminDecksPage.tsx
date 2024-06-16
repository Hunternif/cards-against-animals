import { useState } from 'react';
import { Accordion, AccordionItem } from '../../components/Accordion';
import { GameButton } from '../../components/Buttons';
import { useDIContext } from '../../di-context';
import { exportDecksFun } from '../../firebase';
import { useAsyncData } from '../../hooks/data-hooks';
import { sleep } from '../../shared/utils';
import { AdminDeck } from './admin-components/AdminDeck';
import { AdminSubpage } from './admin-components/AdminSubpage';

export function AdminDecksPage() {
  const { deckRepository } = useDIContext();
  const decks = useAsyncData(deckRepository.getDecks());

  return (
    <AdminSubpage headerContent={<Toolbar />}>
      <Accordion>
        {decks &&
          decks.map((deck) => {
            return (
              <AccordionItem
                key={deck.id}
                header={
                  <div className="deck-header">
                    <span className="deck-title">{deck.title}</span>
                    <span className="deck-id">id: {deck.id}</span>
                  </div>
                }
              >
                <AdminDeck deckID={deck.id} />
              </AccordionItem>
            );
          })}
      </Accordion>
    </AdminSubpage>
  );
}

function Toolbar() {
  const [exporting, setExporting] = useState(false);
  async function handleClickExportDecks() {
    setExporting(true);
    const data = await exportDecksFun();
    await sleep(1000);
    setExporting(false);
    console.log(data);
  }
  return (
    <div className="admin-decks-toolbar">
      <h2>Decks</h2>
      <GameButton
        light
        small
        onClick={handleClickExportDecks}
        disabled={exporting}
      >
        {exporting ? 'Exporting...' : 'Export decks'}
      </GameButton>
    </div>
  );
}
