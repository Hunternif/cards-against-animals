import { useState } from 'react';
import { updateCardsForMerge } from '../../../api/deck/deck-merger';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { VirtualTable } from '../../../components/VirtualTable';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { useDIContext } from '../../../di-context';
import { combinedCardList } from '../../../shared/deck-utils';
import { Deck, DeckCard } from '../../../shared/types';
import { AdminDeckCardRow, adminDeckRowHeight } from './AdminDeckCardRow';
import { AdminDeckControlRow } from './AdminDeckControlRow';
import { AdminDeckSelector } from './AdminDeckSelector';
import { useErrorContext } from '../../../components/ErrorContext';
import { DeckCardSet, emptySet } from '../../../api/deck/deck-card-set';

interface Props {
  sourceDeck: Deck;
  copiedCards: DeckCardSet;
}

export function AdminCopyCardsDialog({ sourceDeck, copiedCards }: Props) {
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  const [updatedCards, setUpdatedCards] = useState<DeckCardSet>(emptySet);
  const [combinedSet, setCombinedSet] = useState<DeckCardSet>(copiedCards);
  const [merging, setMerging] = useState(false);

  async function handleSelectDeck(deck: Deck | null) {
    if (deck == null) {
      setTargetDeck(null);
      setUpdatedCards(emptySet);
      setCombinedSet(copiedCards);
    } else {
      setMerging(true);
      try {
        const fullDeck = await deckRepository.downloadDeck(deck.id);
        const updatedCards = updateCardsForMerge(fullDeck, copiedCards);
        setTargetDeck(fullDeck);
        setUpdatedCards(updatedCards);
        setCombinedSet(DeckCardSet.fromDeck(fullDeck).append(updatedCards));
      } catch (e: any) {
        setError(e);
      } finally {
        setMerging(false);
      }
      // TODO: scroll table to bottom.
    }
  }

  return (
    <>
      <AdminDeckSelector
        onSelectDeck={handleSelectDeck}
        exceptIDs={[sourceDeck.id]}
      />
      <AdminDeckControlRow readOnly cards={combinedSet} />
      <ScrollContainer scrollLight className="table-container">
        <VirtualTable
          className="admin-deck-table"
          rowHeight={adminDeckRowHeight}
          data={combinedSet.cards}
          render={(card) => <AdminDeckCardRow card={card} />}
        />
      </ScrollContainer>
    </>
  );
}
