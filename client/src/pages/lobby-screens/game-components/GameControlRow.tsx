import { CSSProperties, ReactNode } from 'react';
import { GameButton } from '../../../components/Buttons';
import { DiscardCost, ResponseCardInGame } from '../../../shared/types';
import { assertExhaustive } from '../../../shared/utils';
import { useGameContext } from './GameContext';

interface ControlProps {
  selection: ResponseCardInGame[];
  discarding: boolean;
  onBeginDiscard: () => void;
  onSubmitDiscard: () => void;
  onSetDiscardAll: () => void;
  onCancelDiscard: () => void;
  discardedCards: ResponseCardInGame[];
}

const containerStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1em',
  gap: '1em',
};
const leftStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
};
const midStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
};
const rightStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75em',
  justifyContent: 'flex-end',
  alignItems: 'center',
};
const discardInfoStyle: CSSProperties = {
  padding: '0.5rem 0',
  whiteSpace: 'nowrap',
  textAlign: 'center',
};
const discardCountStyle: CSSProperties = {
  whiteSpace: 'normal',
  minWidth: '10em',
  textAlign: 'end',
};
const discardCountSmallStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  textAlign: 'end',
};
const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '0.4em',
};

export function GameControlRow(props: ControlProps) {
  const { selection, discarding } = props;
  const { cost } = useDiscardCost();
  const showDiscard = cost !== 'no_discard';

  if (discarding) {
    return (
      <ControlRowLayout
        center={<DiscardStatusMessage />}
        right={<DiscardControls {...props} />}
      />
    );
  } else {
    return (
      <ControlRowLayout
        center={<SubmitStatusMessage picked={selection.length} />}
        right={showDiscard && <BeginDiscardButton {...props} />}
      />
    );
  }
}

interface RowLayoutProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

function ControlRowLayout({ left, center, right }: RowLayoutProps) {
  return (
    <div style={containerStyle}>
      <div className="layout-side-column" style={leftStyle}>
        {left}
      </div>
      <div className="layout-side-column" style={midStyle}>
        <span className="light" style={discardInfoStyle}>
          {center}
        </span>
      </div>
      <div className="layout-side-column" style={rightStyle}>
        {right}
      </div>
    </div>
  );
}

function DiscardStatusMessage() {
  const { isDiscardFree } = useDiscardCost();
  return isDiscardFree ? (
    <>Select cards to discard.</>
  ) : (
    <>
      Select cards to discard for <Cost b />.
    </>
  );
}

function SubmitStatusMessage({ picked }: { picked: number }) {
  const { player, prompt, responses } = useGameContext();
  const response = responses.find((r) => r.player_uid === player.uid);
  const submitted = response !== undefined;
  const total = prompt?.pick ?? 1;
  if (submitted) return 'Submitted!';
  return prompt ? `Picked ${picked} out of ${total}` : 'Waiting for prompt...';
}

/** Button to start the discarding process. */
function BeginDiscardButton({ onBeginDiscard }: ControlProps) {
  const { canDiscard, isDiscardFree } = useDiscardCost();
  if (isDiscardFree) {
    return (
      <GameButton
        secondary
        small
        onClick={() => onBeginDiscard()}
        title="Discard any number of cards for free"
        disabled={!canDiscard}
      >
        Free discard
      </GameButton>
    );
  } else {
    return (
      <GameButton
        secondary
        small
        onClick={() => onBeginDiscard()}
        title="Discard any number of cards for ⭐ points"
        disabled={!canDiscard}
      >
        Discard: <Cost />
      </GameButton>
    );
  }
}

/** Controls when in the middle of the discarding process. */
function DiscardControls({
  selection,
  discardedCards,
  onSubmitDiscard,
  onSetDiscardAll,
  onCancelDiscard,
}: ControlProps) {
  const { hand } = useGameContext();
  const totalDiscardable = hand.filter(
    (c1) => !selection.find((c2) => c1.id === c2.id),
  ).length;
  const discardCount = discardedCards.length;
  return (
    <>
      <span className="light" style={discardCountSmallStyle}>
        <b>{discardCount}</b> selected
      </span>
      <div style={buttonGroupStyle}>
        {discardCount < totalDiscardable && (
          <GameButton small secondary onClick={onSetDiscardAll}>
            Select all
          </GameButton>
        )}
        <GameButton small secondary onClick={onCancelDiscard}>
          Cancel
        </GameButton>
        {/* TODO: loading animation while discard is in flight */}
        <GameButton
          small
          onClick={() => onSubmitDiscard()}
          disabled={discardCount == 0}
        >
          Discard
        </GameButton>
      </div>
    </>
  );
}

/** b for bold */
function Cost({ b }: { b?: boolean }) {
  return <i>{b ? <b>1</b> : <>1</>}★</i>;
}

/** Helper hook to get the current discard cost for this player. */
function useDiscardCost(): {
  cost: DiscardCost;
  canDiscard: boolean;
  isDiscardFree: boolean;
} {
  const { lobby, playerState } = useGameContext();
  const cost = lobby.settings.discard_cost;
  let isDiscardFree = false;
  let canDiscard = false;
  switch (cost) {
    case 'free':
      isDiscardFree = true;
      canDiscard = true;
      break;
    case 'no_discard':
      break;
    case '1_star':
      // For 'star' cost, allow discarding indefinitely:
      canDiscard = true;
      break;
    case '1_free_then_1_star':
      isDiscardFree = playerState.discards_used === 0;
      // For 'star' cost, allow discarding indefinitely:
      canDiscard = true;
      break;
    case 'token':
      canDiscard = playerState.discard_tokens > 0;
      break;
    default:
      assertExhaustive(cost);
  }
  return { cost, isDiscardFree, canDiscard };
}
