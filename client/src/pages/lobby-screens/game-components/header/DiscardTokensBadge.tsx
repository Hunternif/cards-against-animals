import { InlineButton } from '../../../../components/Buttons';
import { IconCounter } from '../../../../components/IconCounter';
import { IconRecycleInline } from '../../../../components/Icons';
import { useGameContext } from '../GameContext';

/** Shows the number of discard tokens. */
export function DiscardTokensBadge() {
  const { lobby, playerState } = useGameContext();
  if (lobby.settings.discard_cost !== 'token') return null;
  return (
    <InlineButton title="Discard tokens" disabled>
      <IconCounter
        icon={<IconRecycleInline />}
        count={playerState.discard_tokens}
      />
    </InlineButton>
  );
}
