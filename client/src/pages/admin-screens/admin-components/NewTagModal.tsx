import { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TextInput } from '../../../components/FormControls';
import { Deck } from '../../../shared/types';

type Props = {
  show: boolean;
  deck: Deck;
  onHide: () => void;
};

export function NewTagModal({ show, deck, onHide }: Props) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit() {
    if (deck) {
      try {
        setError(undefined);
        setProcessing(true);
        // await addTag(deck, name, description);
        // onHide();
      } catch (e: any) {
        setError(e);
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
