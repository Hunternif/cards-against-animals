import { useEffect, useState } from 'react';

interface Props {
  startTime: Date;
  endTime: Date;
  /** Overrides percentage value */
  pctValue?: number;
  paused?: boolean;
  onClear?: () => void;
}

/** Returns a percent value, from 0 to 100. */
function calculateElapsedPercent(startTime: Date, endTime: Date): number {
  const nowMs = new Date().getTime();
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  let newValue = 100;
  if (endMs > startMs) {
    newValue = (100 * (nowMs - startMs)) / (endMs - startMs);
    newValue = Math.max(0, newValue);
    newValue = Math.min(100, newValue);
  }
  return newValue;
}

/**
 * A horizontal progress bar that corresponds to remaining time.
 */
export function TimerBar({
  startTime,
  endTime,
  pctValue,
  paused,
  onClear,
}: Props) {
  // Number from 0 to 100:
  const [percent, setPercent] = useState(
    pctValue ?? calculateElapsedPercent(startTime, endTime),
  );
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
        const newValue = calculateElapsedPercent(startTime, endTime);
        setPercent(newValue);
        if (newValue >= 100) {
          if (onClear && !calledClear) {
            // console.log(`Cleared timer! ${new Date()}`);
            onClear();
            setCalledClear(true);
          }
          stopTimer();
        }
      }, 50); // Updates often for a smooth movement.
    }

    // Don't start the timer if it's already at 100%.
    const currentValue = calculateElapsedPercent(startTime, endTime);
    if (!paused && pctValue === undefined && currentValue < 100) {
      startTimer();
    }
    return stopTimer;
  }, [startTime, endTime, pctValue, calledClear, paused, onClear]);

  useEffect(() => {
    // Reset when start time changes:
    setCalledClear(false);
  }, [startTime]);

  const barClasses = ['bar'];
  /** Extra thresholds to prevent the bar from sliding backward on reset. */
  if (pctValue === undefined && percent > 5 && percent < 95) {
    barClasses.push('moving');
  }

  return (
    <div className="timer-bar">
      <div
        className={barClasses.join(' ')}
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  );
}
