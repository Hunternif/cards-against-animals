import mc_uh from '../../../assets/sounds/mc_uh.mp3';
import { useGameContext } from './GameContext';
import { TimerCountdown } from './TimerCountdown';
import { TimerPie } from './TimerPie';

interface Props {
  onClear?: () => void;
}

export function TurnTimer({ onClear }: Props) {
  const { turn } = useGameContext();

  function handleLastCall() {
    const audio = new Audio(mc_uh);
    audio.volume = 0.05;
    audio.play();
  }

  if (turn.phase_end_time)
    return (
      <div className="pie-container">
        <TimerPie
          startTime={turn.phase_start_time}
          endTime={turn.phase_end_time}
          onClear={onClear}
          lastCallSec={3}
          onLastCall={handleLastCall}
          reverse
        />
        <TimerCountdown
          startTime={turn.phase_start_time}
          endTime={turn.phase_end_time}
        />
      </div>
    );
  return null;
}
