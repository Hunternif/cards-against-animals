import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  ValueTransition,
} from 'framer-motion';
import { useEffect } from 'react';

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

interface Props extends ValueTransition {
  timeMs: number;
  className?: string;
}

export function AnimatedTimeCounter({ timeMs, className, ...props }: Props) {
  const currentTime = useMotionValue(0);
  const formatted = useTransform(() => formatDuration(currentTime.get()));

  useEffect(() => {
    const controls = animate(currentTime, timeMs, props);
    return () => controls.stop();
  }, [timeMs, props]);

  return (
    <>
      <motion.span className={`animated-counter ${className}`}>
        {formatted}
      </motion.span>
    </>
  );
}
