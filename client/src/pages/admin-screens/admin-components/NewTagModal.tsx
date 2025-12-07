import { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TextInput } from '../../../components/FormControls';
import { Deck, DeckTag } from '@shared/types';
import { useDIContext } from '../../../di-context';
import { useErrorContext } from '../../../components/ErrorContext';

type Props = {
  show: boolean;
  deck: Deck;
  onHide: () => void;
};

export function NewTagModal({ show, deck, onHide }: Props) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  const { deckRepository } = useDIContext();
  const [error, setError] = useState<string>();
  const { setError: setGlobalError } = useErrorContext();

  async function handleSubmit() {
    if (deck) {
      try {
        setError(undefined);
        setProcessing(true);
        if (deck.tags.find((t) => t.name === name)) {
          setError(`Tag ${name} already exists`);
        } else {
          deck.tags.push(new DeckTag(name, description));
          await deckRepository.updateDeck(deck);
          onHide();
        }
      } catch (e: any) {
        setGlobalError(e);
      } finally {
        setProcessing(false);
      }
    }
  }

  function handleCancel() {
    setError(undefined);
    onHide();
  }

  return (
    <ConfirmModal
      className="new-tag-modal"
      show={show}
      onConfirm={handleSubmit}
      onCancel={handleCancel}
      okText="OK"
      loading={processing}
      loadingText="Saving..."
      title="New tag"
    >
      <TextInput onChange={async (val) => setName(val)} placeholder="Name" />
      <TextInput
        onChange={async (val) => setDescription(val)}
        placeholder="Description"
      />
      {error && <div className="error-text">{error}</div>}
    </ConfirmModal>
  );
}
