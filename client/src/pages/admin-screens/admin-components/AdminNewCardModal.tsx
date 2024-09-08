import { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { useDIContext } from '../../../di-context';
import { CardType, Deck, ResponseDeckCard } from '../../../shared/types';
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
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [type, setType] = useState<CardType>('response');
  const [card, setCard] = useState(
    new ResponseDeckCard('new_id', '', 0, 0, 0, 0, 0, 0, []),
  );

  const cardClasses = ['editable-card'];
  if (type === 'prompt') cardClasses.push('card-prompt');
  if (type === 'response') cardClasses.push('card-response');

  function handleChange() {
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (deck && card) {
        await deckRepository.addCard(deck, card);
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
    setCard(new ResponseDeckCard('new_id', '', 0, 0, 0, 0, 0, 0, []));
    setDirty(false);
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
      <CardEditor deck={deck} card={card} onChange={handleChange} />
    </ConfirmModal>
  );
}
