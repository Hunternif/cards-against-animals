import { useState } from 'react';
import { VirtualTable } from '../../../components/VirtualTable';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { useDIContext } from '../../../di-context';
import { Deck, DeckCard } from '../../../shared/types';
import { AdminDeckCardRow, adminDeckRowHeight } from './AdminDeckCardRow';
import { AdminDeckControlRow } from './AdminDeckControlRow';
import { AdminDeckSelector } from './AdminDeckSelector';

interface Props {
  sourceDeck: Deck;
  copiedCards: DeckCard[];
}

function combinedCardList(deck: Deck): DeckCard[] {
  const list: DeckCard[] = deck.prompts;
  return list.concat(deck.responses);
}

export function AdminCopyCardsDialog({ sourceDeck, copiedCards }: Props) {
  const { deckRepository } = useDIContext();
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  const [combinedList, setCombinedList] = useState<DeckCard[]>(copiedCards);

  async function handleSelectDeck(deck: Deck | null) {
    if (deck == null) {
      setTargetDeck(null);
      setCombinedList(copiedCards);
    } else {
      const fullDeck = await deckRepository.downloadDeck(deck.id);
      setTargetDeck(fullDeck);
      setCombinedList(combinedCardList(fullDeck).concat(copiedCards));
      // TODO: scroll table to bottom.
    }
  }

  return (
    <>
      <AdminDeckSelector
        onSelectDeck={handleSelectDeck}
        exceptIDs={[sourceDeck.id]}
      />
      <AdminDeckControlRow readOnly cards={combinedList} />
      <ScrollContainer scrollLight className="table-container">
        <VirtualTable
          className="admin-deck-table"
          rowHeight={adminDeckRowHeight}
          data={combinedList}
          render={(card) => <AdminDeckCardRow card={card} />}
        />
      </ScrollContainer>
    </>
  );
}
