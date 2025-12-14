import { useEffect, useState } from 'react';
import { Pie } from './Pie';

interface Props {
  startTime: Date;
  endTime: Date;
  /** Overrides percentage value */
  pctValue?: number;
  paused?: boolean;
  /** Called when the timer reaches 100% */
  onCompleted?: () => void;
  /** Called a few seconds before time runs out */
  onLastCall?: () => void;
  /** Seconds until the end when 'last call' is called. */
  lastCallSec?: number;
  /** If true, the pie timer will go from full to nothing. */
  reverse?: boolean;
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

/** Returns true if there is less than [seconds] remaining until [endTime]. */
function isLastCall(endTime: Date, seconds: number): boolean {
  const nowMs = new Date().getTime();
  const endMs = endTime.getTime();
  return nowMs > endMs - seconds * 1000;
}

/**
 * A pie-chart progress bar that corresponds to remaining time.
 */
export function TimerPie({
  startTime,
  endTime,
  pctValue,
  paused,
  onCompleted,
  onLastCall,
  lastCallSec,
  reverse,
}: Props) {
  // Number from 0 to 100:
  const [percent, setPercent] = useState(
    pctValue ?? calculateElapsedPercent(startTime, endTime),
  );
  const [calledCompleted, setCalledCompleted] = useState(false);
  const [calledLastCall, setCalledLastCall] = useState(false);

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
        if (
          !calledLastCall &&
          onLastCall &&
          lastCallSec != null &&
          isLastCall(endTime, lastCallSec)
        ) {
          setCalledLastCall(true);
          onLastCall();
        }
        if (newValue >= 100) {
          if (onCompleted && !calledCompleted) {
            // console.log(`Cleared timer! ${new Date()}`);
            onCompleted();
            setCalledCompleted(true);
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
  }, [
    startTime,
    endTime,
    pctValue,
    calledCompleted,
    calledLastCall,
    lastCallSec,
    paused,
    onCompleted,
    onLastCall,
  ]);

  useEffect(() => {
    // Reset when start time changes:
    setCalledCompleted(false);
  }, [startTime]);

  const classes = ['timer-pie'];
  if (percent > 75) classes.push('running-out');
  if (calledLastCall) classes.push('last-call');

  return (
    <Pie className={classes.join(' ')} percent={percent} reverse={reverse} />
  );
}
