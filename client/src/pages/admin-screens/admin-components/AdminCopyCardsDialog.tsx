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
  onComplete: (message: string) => void;
}

export function AdminCopyCardsDialog({
  sourceDeck,
  copiedCards,
  onComplete,
}: Props) {
  const normalCopiedCards = useMemo(
    () => normalizeCardset(copiedCards),
    [copiedCards],
  );
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [targetDeck, setTargetDeck] = useState<Deck | null>(null);

  // Only new cards, with updated IDs:
  const [updatedCards, setUpdatedCards] =
    useState<DeckCardSet>(normalCopiedCards);

  // All cards in the tentative merged target deck:
  const [combinedSet, setCombinedSet] =
    useState<DeckCardSet>(normalCopiedCards);

  const [merging, setMerging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckID, setNewDeckID] = useState('');
  const valid = targetDeck != null || (newDeckTitle != '' && newDeckID != '');

  async function handleSelectDeck(deck: Deck | null) {
    if (deck == null) {
      setTargetDeck(null);
      setUpdatedCards(normalCopiedCards);
      setCombinedSet(normalCopiedCards);
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

  async function handleSubmit() {
    try {
      setSubmitting(true);
      // TODO: highlight duplicates
      // TODO: highlight new cards
      // TODO: create migration table
      const mergedDeck = mergeIntoDeck(
        targetDeck ?? new Deck(newDeckID, newDeckTitle),
        updatedCards,
        sourceDeck.tags,
      );
      if (targetDeck == null) {
        await deckRepository.uploadNewDeck(mergedDeck);
      } else {
        await deckRepository.uploadDeck(mergedDeck);
      }
      onComplete(
        `Merged ${copiedCards.size} cards into deck '${mergedDeck.title}'`,
      );
    } catch (e: any) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="deck-form">
        <AdminDeckSelector
          onSelectDeck={handleSelectDeck}
          exceptIDs={[sourceDeck.id]}
          disabled={submitting}
        />
        {/* spacer */}
        <div />
        {targetDeck == null && (
          <>
            <TextInput
              placeholder="Title: My new deck"
              onChange={async (val) => setNewDeckTitle(val)}
              disabled={submitting}
            />
            <TextInput
              placeholder="ID: my_deck_id"
              onChange={async (val) => setNewDeckID(val)}
              disabled={submitting}
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
        <GameButton
          accent
          className="btn-submit"
          disabled={!valid || merging || submitting}
          onClick={handleSubmit}
        >
          Submit
        </GameButton>
      </footer>
    </>
  );
}
