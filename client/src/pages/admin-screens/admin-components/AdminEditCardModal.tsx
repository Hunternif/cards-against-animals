import { ConfirmModal } from '../../../components/ConfirmModal';
import { DeckCard } from '../../../shared/types';
import {
  CardContent,
  LargeCard,
} from '../../lobby-screens/game-components/LargeCard';

interface Props {
  /** If undefined, the modal is hidden */
  card?: DeckCard;
  onComplete: () => void;
  onCancel: () => void;
}

export function AdminEditCardModal({ card, onComplete, onCancel }: Props) {
  const cardClasses = ['editable-card'];
  if (card?.type === 'prompt') cardClasses.push('card-prompt');
  if (card?.type === 'response') cardClasses.push('card-response');
  return (
    <ConfirmModal
      closeButton
      longFormat
      title="Edit card"
      className="edit-card-modal"
      show={card != null}
      okText="Save"
      onConfirm={onComplete}
      onCancel={onCancel}
    >
      <LargeCard className={cardClasses.join(' ')}>
        <CardContent>{card?.content}</CardContent>
      </LargeCard>
    </ConfirmModal>
  );
}
