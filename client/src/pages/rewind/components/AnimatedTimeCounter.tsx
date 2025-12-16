import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  ValueTransition,
} from 'framer-motion';
import { useEffect } from 'react';

const formatDuration = (ms: number, full?: boolean) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  let hourStr = hours <= 0 ? '' : full ? `${hours} hours` : `${hours}h`;
  let minStr = full ? `${minutes} minutes` : `${minutes}m`;
  if (hours > 0) {
    return `${hourStr} ${minStr}`;
  }
  return `${minStr}`;
};

interface DurationProps {
  ms: number;
  full?: boolean;
}
function FormattedDuration({ ms, full }: DurationProps) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return (
    <>
      {hours > 0 && (
        <>
          <span>{hours}</span>
          {full ? (
            <span className="hour-full">hours</span>
          ) : (
            <span className="hour-short">h</span>
          )}
        </>
      )}{' '}
      <span>{minutes}</span>
      {full ? (
        <span className="minute-full">minutes</span>
      ) : (
        <span className="minute-short">m</span>
      )}
    </>
  );
}

interface Props extends ValueTransition {
  timeMs: number;
  className?: string;
  full?: boolean;
}

export function AnimatedTimeCounter({
  timeMs,
  className,
  full,
  ...props
}: Props) {
  const currentTime = useMotionValue(0);
  const duration = useTransform(() => currentTime.get());
  // const formatted = useTransform(() => formatDuration(currentTime.get(), full));

  const hours = useTransform(() =>
    Math.floor(currentTime.get() / (1000 * 60 * 60)),
  );
  const hoursDisplay = useTransform(() =>
    hours.get() > 0 ? 'inherit' : 'none',
  );
  const minutes = useTransform(() =>
    Math.floor((currentTime.get() % (1000 * 60 * 60)) / (1000 * 60))
      .toString()
      .padStart(2, '0'),
  );

  useEffect(() => {
    const controls = animate(currentTime, timeMs, props);
    return () => controls.stop();
  }, [timeMs, props]);

  return (
    <div
      className={`animated-time-counter ${className}`}
      style={{ display: 'flex' }}
    >
      <motion.span
        className="hours-container"
        style={{ display: hoursDisplay }}
      >
        <motion.span className="hours-value time-value">{hours}</motion.span>
        {full ? (
          <span className="hour-full time-units">hours</span>
        ) : (
          <span className="hour-short time-units">h</span>
        )}
      </motion.span>
      <motion.span className="mins-container">
        <motion.span className="minutes-value time-value">
          {minutes}
        </motion.span>
        {full ? (
          <span className="minute-full time-units">minutes</span>
        ) : (
          <span className="minute-short time-units">m</span>
        )}
      </motion.span>
    </div>
  );
}
