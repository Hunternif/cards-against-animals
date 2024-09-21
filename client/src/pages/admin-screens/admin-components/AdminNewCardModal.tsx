import { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { useDIContext } from '../../../di-context';
import { useHandler } from '../../../hooks/data-hooks';
import {
  CardType,
  Deck,
  DeckCard,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import { assertExhaustive } from '../../../shared/utils';
import { CardEditor } from './CardEditor';

interface Props {
  show: boolean;
  deck: Deck;
  onClose: () => void;
}

/** Saves */
export function AdminNewCardModal({ show, deck, onClose }: Props) {
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [dirty, setDirty] = useState(false);

  const [card, setCard] = useState<DeckCard>(
    new ResponseDeckCard('new_id', '', 0, 0, 0, 0, 0, 0, []),
  );

  const cardClasses = ['editable-card'];
  if (card.type === 'prompt') cardClasses.push('card-prompt');
  if (card.type === 'response') cardClasses.push('card-response');

  function handleChange() {
    setDirty(true);
  }

  function handleCancel() {
    beforeClose();
    onClose();
  }

  /** Called before the modal is closed, to clear state. */
  function beforeClose() {
    setCard(new ResponseDeckCard('new_id', '', 0, 0, 0, 0, 0, 0, []));
    setDirty(false);
  }

  const [handleSave, saving] = useHandler(async () => {
    if (deck && card) {
      await deckRepository.addCard(deck, card);
    }
    beforeClose();
    onClose();
  }, [deckRepository, deck, card, beforeClose, onClose]);

  function handleChangeType(newType: CardType) {
    switch (newType) {
      case 'prompt':
        setCard(
          new PromptDeckCard(
            card.id,
            card.content,
            1,
            card.rating,
            card.views,
            card.plays,
            card.discards,
            card.likes,
            card.tags,
            0,
            0,
            card.time_created,
          ),
        );
        break;
      case 'response':
        setCard(
          new ResponseDeckCard(
            card.id,
            card.content,
            card.rating,
            card.views,
            card.plays,
            card.discards,
            card.wins,
            0,
            card.tags,
            card.time_created,
            undefined,
          ),
        );
        break;
      default:
        assertExhaustive(newType);
    }
    handleChange();
  }

  return (
    <ConfirmModal
      closeButton
      longFormat
      title={dirty ? 'Edit card*' : 'Edit card'}
      className="edit-card-modal"
      show={show}
      okText="Save"
      onConfirm={handleSave}
      onCancel={handleCancel}
      processing={saving}
      okButton={{ accent: true }}
    >
      <CardEditor
        deck={deck}
        card={card}
        onChange={handleChange}
        onChangeType={handleChangeType}
      />
    </ConfirmModal>
  );
}
