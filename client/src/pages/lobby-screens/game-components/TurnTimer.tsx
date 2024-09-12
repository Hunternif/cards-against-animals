import { useGameContext } from './GameContext';
import { TimerPie } from './TimerPie';

interface Props {
  onClear?: () => void;
}

export function TurnTimer({ onClear }: Props) {
  const { turn } = useGameContext();
  if (turn.phase_end_time)
    return (
      <div className="pie-container">
        <TimerPie
          startTime={turn.phase_start_time}
          endTime={turn.phase_end_time}
          onClear={onClear}
        />
      </div>
    );
  return null;
}
