import { useGameContext } from './GameContext';
import { TimerBar } from './TimerBar';

interface Props {
  onClear?: () => void;
}

export function TurnTimer({ onClear }: Props) {
  const { turn } = useGameContext();
  if (turn.phase_end_time)
    return (
      <TimerBar
        startTime={turn.phase_start_time}
        endTime={turn.phase_end_time}
        onClear={onClear}
      />
    );
  return null;
}
