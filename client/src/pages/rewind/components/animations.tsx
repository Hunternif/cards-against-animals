import { ValueTransition, motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props extends ValueTransition {
  left?: boolean;
  right?: boolean;
  shaky?: boolean;
  snappy?: boolean;
  children: ReactNode;
  className?: string;
}

export function MotionSlideIn({
  left,
  right,
  className,
  children,
  ...props
}: Props) {
  return (
    <motion.div
      className={className}
      initial={{ x: left ? '-50px' : right ? '50px' : '-50px', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20, ...props }}
    >
      {children}
    </motion.div>
  );
}
