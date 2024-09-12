import { useEffect, useState } from 'react';
import { Svg } from '../../../components/Icons';

interface Props {
  startTime: Date;
  endTime: Date;
  /** Overrides percentage value */
  pctValue?: number;
  paused?: boolean;
  onClear?: () => void;
  /** Called a few seconds before time runs out */
  onLastCall?: () => void;
  /** Seconds until the end when 'last call' is called. */
  lastCallSec?: number;
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
 * Returns a SVG path that covers the given angle.
 * Thanks to https://css-tricks.com/css-pie-timer/#comment-184984
 */
function svgPiePath(degrees: number, radius: number) {
  if (degrees < 0) degrees = 0;
  if (degrees >= 360) degrees = 359.999;
  const r = (degrees * Math.PI) / 180;
  const x = Math.sin(r) * radius;
  const y = Math.cos(r) * -radius;
  const mid = degrees > 180 ? 1 : 0;
  return `M 0 0 v -${radius} A ${radius} ${radius} 1 ${mid} 1 ${x} ${y} z`;
}

/**
 * A pie-chart progress bar that corresponds to remaining time.
 */
export function TimerPie({
  startTime,
  endTime,
  pctValue,
  paused,
  onClear,
  onLastCall,
  lastCallSec,
}: Props) {
  // Number from 0 to 100:
  const [percent, setPercent] = useState(
    pctValue ?? calculateElapsedPercent(startTime, endTime),
  );
  const [calledClear, setCalledClear] = useState(false);
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
  }, [
    startTime,
    endTime,
    pctValue,
    calledClear,
    calledLastCall,
    lastCallSec,
    paused,
    onClear,
    onLastCall,
  ]);

  useEffect(() => {
    // Reset when start time changes:
    setCalledClear(false);
  }, [startTime]);

  const classes = ['timer-pie'];
  if (percent > 75) classes.push('running-out');
  if (calledLastCall) classes.push('last-call');

  return (
    <div className={classes.join(' ')}>
      <Svg className="pie-svg" viewBox="0 0 200 200">
        <path
          fill="currentColor"
          d={svgPiePath(percent * 3.6, 100)}
          transform="translate(100, 100)"
        />
      </Svg>
    </div>
  );
}
