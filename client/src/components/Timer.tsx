import { useEffect, useState } from "react";

interface Props {
  totalMs: number,
  onClear?: () => void,
}

/**
 * Displays countdown from top to 0 every second.
 * TODO: may be bugged?
 */
export function Timer({ totalMs, onClear }: Props) {
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [startMs, setStartMs] = useState(new Date().getTime());

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    function reset() {
      // console.log(`Reset`);
      stopTimer();
      setRemainingMs(totalMs);
      setStartMs(new Date().getTime());
    }

    function stopTimer() {
      if (interval) {
        // console.log(`Timer stopped at ${remainingMs}`);
        clearInterval(interval);
        interval = null;
      }
    }

    reset();
    interval = setInterval(() => {
      const nowMs = new Date().getTime();
      const newRemainingMs = Math.max(0, startMs + totalMs - nowMs);
      // console.log(`Remaining: ${newRemainingMs}`);
      setRemainingMs(newRemainingMs);
      if (newRemainingMs <= 0) {
        // console.log(`Finished`);
        if (onClear) onClear();
        stopTimer();
      }
    }, 1000);

    return reset;
  }, [totalMs, onClear]);

  return Math.ceil(remainingMs / 1000);
}