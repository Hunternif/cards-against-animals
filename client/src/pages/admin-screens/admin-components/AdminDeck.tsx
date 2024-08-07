import { useContext, useState } from 'react';
import { DeckCardSet, emptySet } from '../../../api/deck/deck-card-set';
import { GameButton } from '../../../components/Buttons';
import { ErrorContext } from '../../../components/ErrorContext';
import { IconLockInline } from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Modal, ModalBody } from '../../../components/Modal';
import { VirtualTable } from '../../../components/VirtualTable';
import { useDIContext } from '../../../di-context';
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
  const [deckCardset, setDeckCardset] = useState(emptySet);
  const { setError } = useContext(ErrorContext);
  // Maps card 'typed id' to card
  const [selectedCards, setSelectedCards] = useState<Map<string, DeckCard>>(
    new Map(),
  );
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [copyStatusMsg, setCopyStatusMsg] = useState('');

  // TODO: optimize, retain the same instance between renders.
  const selectedCardset = new DeckCardSet(selectedCards.values());
  const isAnySelected = selectedCardset.size > 0;

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
        new Map(deckCardset.cards.map((c) => [cardTypedID(c), c])),
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
          setDeckCardset(DeckCardSet.fromDeck(val).sortByIDs());
        })
        .catch((e) => setError(e));
    }
  });

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
              setCopyStatusMsg(msg);
            }}
          />
        </ModalBody>
      </Modal>

      <Modal show={copyStatusMsg != ''} onHide={() => setCopyStatusMsg('')}>
        {copyStatusMsg}
        <footer>
          <GameButton onClick={() => setCopyStatusMsg('')}>OK</GameButton>
        </footer>
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

      {/* Extra controls: */}
      <div className="admin-deck-control-row">
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
      </div>

      <VirtualTable
        className="admin-deck-table"
        rowHeight={adminDeckRowHeightWithBorder}
        data={deckCardset.cards}
        header={
          <AdminDeckTableHeader
            cards={deckCardset}
            selected={selectedCardset}
            onToggleAll={toggleSelectAll}
          />
        }
        render={(card) => (
          <AdminDeckCardRow
            card={card}
            selected={isSelected(card)}
            onClick={() => toggleSelectedCard(card)}
          />
        )}
      />
    </>
  );
}
