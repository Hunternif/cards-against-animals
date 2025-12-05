import clock_tick_loop from '../../../assets/sounds/clock/clock_tick_loop.mp3';
import { useGameContext } from './GameContext';
import { TimerCountdown } from './TimerCountdown';
import { TimerPie } from './TimerPie';

interface Props {
  onClear?: () => void;
}

export function TurnTimer({ onClear }: Props) {
  const { turn } = useGameContext();

  function handleLastCall() {
    const audio = new Audio(clock_tick_loop);
    audio.volume = 0.5;
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
