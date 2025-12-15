import { AnimatePresence, motion, usePresenceData, wrap } from 'framer-motion';
import React, {
  forwardRef,
  ReactNode,
  SVGProps,
  useCallback,
  useState,
} from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean;
}

/** Carousel that renders only a single item. */
export default function SingleCarousel({ loop, children, ...props }: Props) {
  const childrenArray = React.Children.toArray(children);
  const count = childrenArray.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const setSlide = useCallback(
    (newDirection: 1 | -1) => {
      let nextIndex = index + newDirection;
      if (nextIndex < 0) {
        if (loop) nextIndex = count - 1;
        else nextIndex = 0;
      }
      if (nextIndex >= count) {
        if (loop) nextIndex = 0;
        else nextIndex = count - 1;
      }
      setIndex(nextIndex);
      setDirection(newDirection);
    },
    [index, count],
  );

  // Swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightwipe = distance > minSwipeDistance;
    const isLeftSwipe = distance < -minSwipeDistance;

    if (isRightwipe) {
      setSlide(1);
    } else if (isLeftSwipe) {
      setSlide(-1);
    }
  };

  return (
    <div
      {...props}
      style={{ ...container, ...props.style }}
      className={`carousel ${props.className ?? ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <motion.button
        initial={false}
        aria-label="Previous"
        className="carousel-button"
        onClick={() => setSlide(-1)}
        whileTap={{ scale: 0.9 }}
        style={{
          visibility: loop || index > 0 ? 'visible' : 'hidden',
        }}
      >
        <ArrowLeft />
      </motion.button>
      <AnimatePresence custom={direction} initial={true} mode="popLayout">
        <Slide key={index}>{childrenArray[index]}</Slide>
      </AnimatePresence>
      <motion.button
        initial={false}
        aria-label="Next"
        className="carousel-button"
        onClick={() => setSlide(1)}
        whileTap={{ scale: 0.9 }}
        style={{
          visibility: loop || index < count - 1 ? 'visible' : 'hidden',
        }}
      >
        <ArrowRight />
      </motion.button>
    </div>
  );
}

const Slide = forwardRef(function Slide(
  { children }: { children: ReactNode },
  ref: React.Ref<HTMLDivElement>,
) {
  const direction = usePresenceData();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: `${direction * 100}%` }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          // delay: 0.2,
          type: 'tween',
          // visualDuration: 0.3,
          // bounce: 0.4,
        },
      }}
      exit={{ opacity: 0, x: `${direction * -100}%` }}
    >
      {children}
    </motion.div>
  );
});

/**
 * ==============   Icons   ================
 */
const iconsProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function ArrowLeft() {
  return (
    <svg {...iconsProps}>
      <path d="m14 19-7-7 7-7" />
      {/* <path d="M19 12H5" /> */}
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg {...iconsProps}>
      {/* <path d="M5 12h14" /> */}
      <path d="m10 5 7 7-7 7" />
    </svg>
  );
}

/**
 * ==============   Styles   ================
 */

const container: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  overflow: 'visible',
};

// const button: React.CSSProperties = {
//   width: 40,
//   height: 40,
//   padding: 0,
//   borderRadius: '50%',
//   border: 'none',
//   display: 'flex',
//   justifyContent: 'center',
//   alignItems: 'center',
//   position: 'relative',
//   zIndex: 1,
//   outlineOffset: 2,
// };
