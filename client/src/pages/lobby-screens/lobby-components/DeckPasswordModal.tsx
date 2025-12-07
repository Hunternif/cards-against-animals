import { useState } from 'react';
import { unlockDeckForUser } from '../../../api/deck/deck-lock-api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { TextInput } from '../../../components/FormControls';
import { Deck } from '@shared/types';

type DeckPasswordProps = {
  deck?: Deck;
  onComplete: () => void;
  onCancel: () => void;
};

export function DeckPasswordModal({
  deck,
  onComplete,
  onCancel,
}: DeckPasswordProps) {
  const [password, setPassword] = useState<string>('');
  const [unlocking, setUnlocking] = useState(false);
  const { setError: setGlobalError } = useErrorContext();
  const [error, setError] = useState<string>();

  async function saveDeckPassword() {
    if (deck) {
      try {
        setError(undefined);
        setUnlocking(true);
        if (await unlockDeckForUser(deck, password)) {
          onComplete();
        } else {
          setError('Invalid password');
        }
      } catch (e: any) {
        setGlobalError(e);
      } finally {
        setUnlocking(false);
      }
    }
  }

  function handleCancel() {
    setError(undefined);
    onCancel();
  }

  return (
    <ConfirmModal
      className="deck-password-modal"
      show={deck != null}
      onConfirm={saveDeckPassword}
      onCancel={handleCancel}
      okText="OK"
      loading={unlocking}
      loadingText="Unlocking..."
    >
      <p>Password for '{deck?.title}':</p>
      <TextInput password onChange={async (val) => setPassword(val)} />
      {error && <div className="error-text">{error}</div>}
    </ConfirmModal>
  );
}
