import { useState } from 'react';
import { exportDecksToFile } from '../../api/deck/deck-export';
import { Accordion, AccordionItem } from '../../components/Accordion';
import { GameButton } from '../../components/Buttons';
import { useErrorContext } from '../../components/ErrorContext';
import { useDIContext } from '../../di-context';
import { useAsyncData } from '../../hooks/data-hooks';
import { AdminDeck } from './admin-components/AdminDeck';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { IconLockInline } from '../../components/Icons';

export function AdminDecksPage() {
  const { deckRepository } = useDIContext();
  const [decks] = useAsyncData(deckRepository.getDecks([]));

  return (
    <AdminSubpage headerContent={<Toolbar />}>
      <Accordion>
        {decks &&
          decks.map((deck) => {
            return (
              <AccordionItem
                className="admin-deck-accordion"
                key={deck.id}
                header={
                  <div className={`deck-header visibility-${deck.visibility}`}>
                    <span className="deck-title">
                      {deck.visibility === 'locked' && <IconLockInline />}
                      {deck.title}
                      {deck.visibility === 'hidden' && <> (hidden)</>}
                    </span>
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
  const { deckRepository } = useDIContext();
  const [exporting, setExporting] = useState(false);
  const { setError } = useErrorContext();
  async function handleClickExportDecks() {
    setExporting(true);
    try {
      await exportDecksToFile(deckRepository);
    } catch (e: any) {
      setError(e);
    } finally {
      setExporting(false);
    }
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
