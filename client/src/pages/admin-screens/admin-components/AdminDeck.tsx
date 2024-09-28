import { useCallback, useContext, useMemo, useState } from 'react';
import { DeckCardSet, emptySet } from '../../../api/deck/deck-card-set';
import { GameButton } from '../../../components/Buttons';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ErrorContext } from '../../../components/ErrorContext';
import { TextInput } from '../../../components/FormControls';
import {
  IconLockInline,
  IconPlus,
  IconSearch,
  IconTrash,
} from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Modal, ModalBody, ModalFooter } from '../../../components/Modal';
import { VirtualTable } from '../../../components/VirtualTable';
import { useDIContext } from '../../../di-context';
import { useHandler } from '../../../hooks/data-hooks';
import { useEffectOnce } from '../../../hooks/ui-hooks';
import { cardTypedID } from '../../../shared/deck-utils';
import { Deck, DeckCard } from '../../../shared/types';
import { AdminCopyCardsDialog } from './AdminCopyCardsDialog';
import {
  AdminDeckCardRow,
  adminDeckRowHeightWithBorder,
} from './AdminDeckCardRow';
import { AdminDeckPasswordModal } from './AdminDeckPasswordModal';
import { AdminDeckTableHeader } from './AdminDeckTableHeader';
import { AdminEditCardModal } from './AdminEditCardModal';
import { AdminNewCardModal } from './AdminNewCardModal';
import { AdminTagsTable } from './AdminTagsTable';

interface Props {
  deckID: string;
}

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deckID }: Props) {
  const { deckRepository } = useDIContext();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [fullDeckCardset, setFullDeckCardset] = useState(emptySet);
  const { setError } = useContext(ErrorContext);
  // Maps card 'typed id' to card
  const [selectedCards, setSelectedCards] = useState<Map<string, DeckCard>>(
    new Map(),
  );
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);

  // TODO: optimize, retain the same instance between renders.
  const selectedCardset = new DeckCardSet(selectedCards.values());
  const isAnySelected = selectedCardset.size > 0;

  const [editedCard, setEditedCard] = useState<DeckCard>();
  const [filterText, setFilterText] = useState('');
  const [filterPrompts, setFilterPrompts] = useState(true);
  const [filterResponses, setFilterResponses] = useState(true);
  const [sortFields, setSortFields] = useState<Array<keyof DeckCard>>([]);

  function isSelected(card: DeckCard): boolean {
    return selectedCards.has(cardTypedID(card));
  }
  function toggleSelectedCard(card: DeckCard) {
    const id = cardTypedID(card);
    const copy = new Map(selectedCards.entries());
    if (selectedCards.has(id)) copy.delete(id);
    else copy.set(id, card);
    setSelectedCards(copy);
  }
  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedCards(
        new Map(currentCardset.cards.map((c) => [cardTypedID(c), c])),
      );
    } else {
      setSelectedCards(new Map());
    }
  }

  // Load deck content
  useEffectOnce(() => {
    if (!deck) {
      deckRepository
        .downloadDeck(deckID)
        .then((val) => {
          setDeck(val);
          const cardset = DeckCardSet.fromDeck(val).sortByIDs();
          setFullDeckCardset(cardset);
        })
        .catch((e) => setError(e));
    }
  });

  /** Recalculates deck set */
  const refresh = useCallback(() => {
    if (deck) {
      const fullCardSet = DeckCardSet.fromDeck(deck).sortByIDs();
      setFullDeckCardset(fullCardSet);
    }
  }, [deck]);

  const [handleDelete, deleting] = useHandler(async () => {
    if (deck) {
      await deckRepository.deleteCards(deck, [...selectedCards.values()]);
      setSelectedCards(new Map());
      setShowDeleteDialog(false);
      refresh();
    }
  }, [deckRepository, deck, selectedCards, refresh]);

  function handleClickColumn(field: keyof DeckCard) {
    let fields = sortFields.slice();
    // TODO: sort up or down
    if (fields.includes(field)) {
      // toggle off:
      fields = fields.filter((f) => f != field);
    } else {
      fields.push(field);
    }
    setSortFields(fields);
  }

  // Compute final card list based on filters:
  const currentCardset = useMemo(() => {
    let cardset = fullDeckCardset;
    if (!filterPrompts) {
      cardset = DeckCardSet.fromList(cardset.responses);
    }
    if (!filterResponses) {
      cardset = DeckCardSet.fromList(cardset.prompts);
    }
    if (filterText.length > 0) {
      // Filter by content:
      const filteredCards = cardset.cards.filter((c) =>
        c.content.toLowerCase().includes(filterText.toLowerCase()),
      );
      cardset = DeckCardSet.fromList(filteredCards);
    }
    for (const field of sortFields) {
      cardset = cardset.sortByField(field);
    }
    // TODO: filter by card IDs or by tags.
    return cardset;
  }, [fullDeckCardset, filterPrompts, filterResponses, filterText, sortFields]);

  if (!deck) return <LoadingSpinner />;

  return (
    <>
      <Modal
        className="copy-cards-dialog"
        show={showCopyDialog}
        onHide={() => setShowCopyDialog(false)}
        title="Copy cards to..."
        closeButton
      >
        <ModalBody longFormat>
          <AdminCopyCardsDialog
            sourceDeck={deck}
            copiedCards={selectedCardset}
            onComplete={(msg) => {
              setShowCopyDialog(false);
              setStatusMsg(msg);
            }}
          />
        </ModalBody>
      </Modal>

      <Modal show={statusMsg != ''} onHide={() => setStatusMsg('')}>
        <ModalBody>{statusMsg}</ModalBody>
        <ModalFooter>
          <GameButton onClick={() => setStatusMsg('')}>OK</GameButton>
        </ModalFooter>
      </Modal>

      <Modal
        className="tags-dialog"
        show={showTagsDialog}
        onHide={() => setShowTagsDialog(false)}
        title="Assign tags"
        closeButton
      >
        <ModalBody longFormat>
          <AdminTagsTable deck={deck} />
        </ModalBody>
      </Modal>

      <AdminDeckPasswordModal
        deck={showLockDialog ? deck : undefined}
        onCancel={() => setShowLockDialog(false)}
        onComplete={() => setShowLockDialog(false)}
      />

      <AdminEditCardModal
        deck={deck}
        card={editedCard}
        onClose={() => setEditedCard(undefined)}
      />

      <AdminNewCardModal
        deck={deck}
        show={showNewCardDialog}
        onClose={() => {
          refresh();
          setShowNewCardDialog(false);
        }}
      />

      <ConfirmModal
        show={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        processing={deleting}
      >
        Delete {selectedCards.size} cards?
      </ConfirmModal>

      {/* Extra controls: */}
      <div className="admin-deck-control-row">
        <GameButton
          inline
          light
          onClick={() => setShowNewCardDialog(true)}
          className="icon-button"
        >
          <IconPlus />
        </GameButton>
        <GameButton
          inline
          light
          onClick={() => setShowDeleteDialog(true)}
          disabled={!isAnySelected}
          className="icon-button"
        >
          <IconTrash />
        </GameButton>
        <GameButton
          inline
          light
          iconLeft={<IconLockInline />}
          disabled={deck.visibility === 'locked'}
          onClick={() => setShowLockDialog(true)}
        >
          Lock
        </GameButton>
        <GameButton
          inline
          light
          onClick={() => setShowCopyDialog(true)}
          disabled={!isAnySelected}
        >
          Copy to...
        </GameButton>
        <GameButton inline light onClick={() => setShowTagsDialog(true)}>
          Tags
        </GameButton>
        <GameButton
          inline
          light={filterPrompts}
          onClick={() => setFilterPrompts(!filterPrompts)}
        >
          P
        </GameButton>
        <GameButton
          inline
          light={filterResponses}
          onClick={() => setFilterResponses(!filterResponses)}
        >
          R
        </GameButton>
        <TextInput
          inline
          className="search-input"
          debounceMs={200}
          placeholder="Search..."
          onChange={(text) => setFilterText(text)}
          iconLeft={<IconSearch />}
        ></TextInput>
      </div>

      <VirtualTable
        className="admin-deck-table"
        rowHeight={adminDeckRowHeightWithBorder}
        data={currentCardset.cards}
        header={
          <AdminDeckTableHeader
            cards={currentCardset}
            selected={selectedCardset}
            onToggleAll={toggleSelectAll}
            onClickField={handleClickColumn}
          />
        }
        render={(card) => (
          <AdminDeckCardRow
            card={card}
            selected={isSelected(card)}
            onClick={() => toggleSelectedCard(card)}
            onEdit={() => setEditedCard(card)}
          />
        )}
      />
    </>
  );
}
