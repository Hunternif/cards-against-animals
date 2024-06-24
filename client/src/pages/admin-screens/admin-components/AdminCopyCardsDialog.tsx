import { useMemo, useState } from 'react';
import { DeckCardSet } from '../../../api/deck/deck-card-set';
import {
  findDuplicates,
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
import { cardTypedID } from '../../../shared/deck-utils';
import { Deck } from '../../../shared/types';
import { AdminDeckCardRow, adminDeckRowHeight } from './AdminDeckCardRow';
import { AdminDeckControlRow } from './AdminDeckControlRow';
import { AdminDeckSelector } from './AdminDeckSelector';
import { Checkbox } from '../../../components/Checkbox';
import { saveDeckMigrations } from '../../../api/deck/deck-migration-repository';

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

  // Card IDs in the deck that were found as duplicates.
  const [duplicateIDs, setDuplicateIDs] = useState(new Set<string>());
  const warnMsg = checkErrors();

  const [merging, setMerging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMig, setSaveMig] = useState(false);

  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckID, setNewDeckID] = useState('');
  const valid = targetDeck != null || (newDeckTitle != '' && newDeckID != '');

  async function handleSelectDeck(deck: Deck | null) {
    if (deck == null) {
      setTargetDeck(null);
      setUpdatedCards(normalCopiedCards);
      setCombinedSet(normalCopiedCards);
      setDuplicateIDs(new Set());
    } else {
      setMerging(true);
      try {
        const fullDeck = await deckRepository.downloadDeck(deck.id);
        const updatedCards = updateCardsForMerge(fullDeck, copiedCards);
        setTargetDeck(fullDeck);
        setUpdatedCards(updatedCards);
        setCombinedSet(DeckCardSet.fromDeck(fullDeck).append(updatedCards));
        // don't await, run it in the background:
        highlightDuplicates(fullDeck, updatedCards);
      } catch (e: any) {
        setError(e);
      } finally {
        setMerging(false);
      }
      // TODO: scroll table to bottom.
    }
  }

  async function highlightDuplicates(deck: Deck, cards: DeckCardSet) {
    const dupes = await findDuplicates(deck, cards);
    const dupeIDs = dupes.cards.map((c) => cardTypedID(c));
    setDuplicateIDs(new Set(dupeIDs));
  }

  function checkErrors(): string {
    if (duplicateIDs.size > 0) {
      return `Found ${duplicateIDs.size} duplicates`;
    }
    return '';
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
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
      if (saveMig) {
        // TODO: await saveDeckMigrations()
      }
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
        <Checkbox
          label="Save migration"
          checked={saveMig}
          onToggle={(checked) => setSaveMig(checked)}
        />
      </div>
      {warnMsg && <div className="warn-msg">{warnMsg}</div>}
      <AdminDeckControlRow readOnly cards={combinedSet} />
      <ScrollContainer scrollLight className="table-container">
        <VirtualTable
          className="admin-deck-table"
          rowHeight={adminDeckRowHeight}
          data={combinedSet.cards}
          render={(card) => (
            <AdminDeckCardRow
              card={card}
              selected={updatedCards.cards.indexOf(card) > -1}
              isErrored={duplicateIDs.has(cardTypedID(card))}
            />
          )}
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
