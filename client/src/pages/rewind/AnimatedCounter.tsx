import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  ValueTransition,
} from 'framer-motion';
import { useEffect } from 'react';

interface Props extends ValueTransition {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className, ...props }: Props) {
  const count = useMotionValue(0);
  const rounded = useTransform(() => Math.round(count.get()));

  useEffect(() => {
    const controls = animate(count, value, props);
    return () => controls.stop();
  }, []);

  return (
    <motion.div className={`animated-counter ${className}`}>
      {rounded}
    </motion.div>
  );
}
