import { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { useDIContext } from '../../../di-context';
import {
  copyDeckCard,
  filterPromptDeckCard,
  filterResponseDeckCard,
} from '@shared/deck-utils';
import { Deck, DeckCard } from '@shared/types';
import { CardEditor } from './CardEditor';

interface Props {
  deck?: Deck;
  /** If undefined, the modal is hidden */
  card?: DeckCard;
  onClose: () => void;
}

export function AdminEditCardModal({
  deck,
  card,
  onClose,
}: Props) {
  const { deckRepository } = useDIContext();
  const { setError } = useErrorContext();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const cardClasses = ['editable-card'];
  const isPrompt = card && filterPromptDeckCard(card);
  const isResponse = card && filterResponseDeckCard(card);
  if (isPrompt) cardClasses.push('card-prompt');
  if (isResponse) cardClasses.push('card-response');

  // Copy of the card, containing modified data:
  const [cardCopy, setCardCopy] = useState(card && copyDeckCard(card));
  if (card && cardCopy == null) {
    setCardCopy(copyDeckCard(card));
  }

  function handleChange() {
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (deck && card && cardCopy) {
        // Apply changes to the original card:
        Object.assign(card, cardCopy);
        await deckRepository.updateCard(deck, card);
      }
      beforeClose();
      onClose();
    } catch (e: any) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    beforeClose();
    onClose();
  }

  /** Called before the modal is closed, to clear state. */
  function beforeClose() {
    setCardCopy(undefined);
    setDirty(false);
  }

  return (
    <ConfirmModal
      closeButton
      longFormat
      title={dirty ? 'Edit card*' : 'Edit card'}
      className="edit-card-modal"
      show={card != null}
      okText="Save"
      onConfirm={handleSave}
      onCancel={handleCancel}
      processing={saving}
      okButton={{ accent: dirty }}
    >
      {cardCopy && (
        <CardEditor deck={deck} card={cardCopy} onChange={handleChange} />
      )}
    </ConfirmModal>
  );
}
