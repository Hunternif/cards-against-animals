import { motion } from 'framer-motion';
import React, {
  SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const GAP = 16; // gap between items.
const SCROLL_AMOUNT = 300; // pixels to scroll per button click

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean;
}

/** Carousel that renders a strip of items and scrolls between them. */
export default function StripCarousel({ loop, children, ...props }: Props) {
  const childrenArray = React.Children.toArray(children);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position and update button visibility
  const checkScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = useCallback((direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;

    const amount = direction * SCROLL_AMOUNT;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  return (
    <div
      {...props}
      style={{ ...outerContainer, ...props.style }}
      className={`carousel ${props.className ?? ''}`}
    >
      <motion.button
        initial={false}
        aria-label="Previous"
        className="carousel-button"
        onClick={() => scroll(-1)}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute',
          left: -50,
          zIndex: 100,
          visibility: canScrollLeft ? 'visible' : 'hidden',
          pointerEvents: canScrollLeft ? 'auto' : 'none',
        }}
      >
        <ArrowLeft />
      </motion.button>
      <div
        className="strip-carousel-container"
        style={innerContainer}
        ref={scrollRef}
      >
        {childrenArray.map((c, i) => (
          <div key={i} style={{ flex: '0 0 auto' }}>
            {c}
          </div>
        ))}
      </div>
      <motion.button
        initial={false}
        aria-label="Next"
        className="carousel-button"
        onClick={() => scroll(1)}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'absolute',
          right: -50,
          zIndex: 100,
          visibility: canScrollRight ? 'visible' : 'hidden',
          pointerEvents: canScrollRight ? 'auto' : 'none',
        }}
      >
        <ArrowRight />
      </motion.button>
    </div>
  );
}

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

const outerContainer: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  // Padding to make buttons appear to the side:
  // paddingLeft: 50,
  // paddingRight: 50,
};

const innerContainer: React.CSSProperties = {
  display: 'flex',
  position: 'relative',
  gap: GAP,
  overflowX: 'scroll',
  overflowY: 'hidden',
  scrollBehavior: 'smooth',
  padding: 20,
  // Hide scrollbar
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
};
