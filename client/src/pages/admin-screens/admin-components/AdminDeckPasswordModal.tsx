import { useState } from 'react';
import { lockDeck } from '../../../api/deck/deck-lock-api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { TextInput } from '../../../components/FormControls';
import { Deck } from '../../../shared/types';

type DeckPasswordProps = {
  deck?: Deck;
  onComplete: () => void;
  onCancel: () => void;
};

/** Sets a new password for a deck. */
export function AdminDeckPasswordModal({
  deck,
  onComplete,
  onCancel,
}: DeckPasswordProps) {
  const [password, setPassword] = useState<string>('');
  const [locking, setLocking] = useState(false);
  const { setError } = useErrorContext();

  async function saveDeckPassword() {
    if (deck) {
      try {
        setLocking(true);
        await lockDeck(deck, password);
        onComplete();
      } catch (e: any) {
        setError(e);
      } finally {
        setLocking(false);
      }
    }
  }

  return (
    <ConfirmModal
      className="deck-password-modal"
      show={deck != null}
      onConfirm={saveDeckPassword}
      onCancel={onCancel}
      okText="OK"
      loading={locking}
      loadingText="Locking..."
    >
      <p>Create password for '{deck?.title}':</p>
      <TextInput password onChange={async (val) => setPassword(val)} />
    </ConfirmModal>
  );
}
