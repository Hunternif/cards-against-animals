import { useEffect, useState } from 'react';

interface Props {
  startTime: Date;
  endTime: Date;
  /** Overrides percentage value */
  pctValue?: number;
  paused?: boolean;
  onClear?: () => void;
}

/** Returns remaining seconds until endTime. */
function calculateRemainingSeconds(endTime: Date): number {
  const nowMs = new Date().getTime();
  const endMs = endTime.getTime();
  const remainingMs = endMs - nowMs;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  return Math.max(0, remainingSeconds);
}

/**
 * A countdown timer that displays remaining seconds.
 */
export function TimerCountdown({
  startTime,
  endTime,
  pctValue,
  paused,
  onClear,
}: Props) {
  const [seconds, setSeconds] = useState(calculateRemainingSeconds(endTime));
  const [calledClear, setCalledClear] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    function stopTimer() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function startTimer() {
      interval = setInterval(() => {
        const newSeconds = calculateRemainingSeconds(endTime);
        setSeconds(newSeconds);
        if (newSeconds <= 0) {
          if (onClear && !calledClear) {
            onClear();
            setCalledClear(true);
          }
          stopTimer();
        }
      }, 100); // Update frequently for accuracy
    }

    // Don't start the timer if it's already at 0.
    const currentSeconds = calculateRemainingSeconds(endTime);
    if (!paused && pctValue === undefined && currentSeconds > 0) {
      startTimer();
    }
    return stopTimer;
  }, [startTime, endTime, pctValue, calledClear, paused, onClear]);

  useEffect(() => {
    // Reset when start time changes:
    setCalledClear(false);
    setSeconds(calculateRemainingSeconds(endTime));
  }, [startTime, endTime]);

  const classes = ['timer-countdown'];
  if (seconds <= 10) classes.push('urgent');
  if (seconds <= 3) classes.push('critical');

  return (
    <div className={classes.join(' ')}>
      <span className="countdown-value">{seconds}</span>
    </div>
  );
}
