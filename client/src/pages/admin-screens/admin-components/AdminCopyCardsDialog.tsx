import { useMemo, useState } from 'react';
import { DeckCardSet, emptySet } from '../../../api/deck/deck-card-set';
import {
  mergeIntoDeck,
  normalizeCardset,
  updateCardsForMerge,
} from '../../../api/deck/deck-merger';
import { GameButton } from '../../../components/Buttons';
import { useErrorContext } from '../../../components/ErrorContext';
import { TextInput } from '../../../components/FormControls';
import { VirtualTable } from '../../../components/VirtualTable';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { useDIContext } from '../../../di-context';
import { Deck } from '../../../shared/types';
import { AdminDeckCardRow, adminDeckRowHeight } from './AdminDeckCardRow';
import { AdminDeckControlRow } from './AdminDeckControlRow';
import { AdminDeckSelector } from './AdminDeckSelector';

interface Props {
  sourceDeck: Deck;
  copiedCards: DeckCardSet;
}

export function AdminCopyCardsDialog({ sourceDeck, copiedCards }: Props) {
  const normalizedCopiedCards = useMemo(
    () => normalizeCardset(copiedCards),
    [copiedCards],
  );
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);
  const [updatedCards, setUpdatedCards] = useState<DeckCardSet>(emptySet);
  const [combinedSet, setCombinedSet] = useState<DeckCardSet>(
    normalizedCopiedCards,
  );
  const [merging, setMerging] = useState(false);

  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckID, setNewDeckID] = useState('');
  const valid = targetDeck != null || (newDeckTitle != '' && newDeckID != '');

  async function handleSelectDeck(deck: Deck | null) {
    if (deck == null) {
      setTargetDeck(null);
      setUpdatedCards(emptySet);
      setCombinedSet(normalizedCopiedCards);
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
      <div className="deck-form">
        <AdminDeckSelector
          onSelectDeck={handleSelectDeck}
          exceptIDs={[sourceDeck.id]}
        />
        {/* spacer */}
        <div />
        {targetDeck == null && (
          <>
            <TextInput
              placeholder="Title: My new deck"
              onChange={async (val) => setNewDeckTitle(val)}
            />
            <TextInput
              placeholder="ID: my_deck_id"
              onChange={async (val) => setNewDeckID(val)}
            />
          </>
        )}
      </div>
      <AdminDeckControlRow readOnly cards={combinedSet} />
      <ScrollContainer scrollLight className="table-container">
        <VirtualTable
          className="admin-deck-table"
          rowHeight={adminDeckRowHeight}
          data={combinedSet.cards}
          render={(card) => <AdminDeckCardRow card={card} />}
        />
      </ScrollContainer>
      <footer>
        <GameButton accent className="btn-submit" disabled={!valid || merging}>
          Submit
        </GameButton>
      </footer>
    </>
  );
}
