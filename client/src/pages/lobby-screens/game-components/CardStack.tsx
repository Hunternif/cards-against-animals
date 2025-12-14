import { CardInGame } from '@shared/types';
import { animate, AnimatePresence, motion } from 'framer-motion';
import {
  CSSProperties,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  detectCat,
  detectDeer,
  detectLenich,
} from '../../../api/deck/deck-parser';
import {
  IconCat,
  IconHeadshot,
  IconHeart,
  IconStarOfDavid,
} from '../../../components/Icons';
import { Twemoji } from '../../../components/Twemoji';
import { useScreenWiderThan } from '../../../components/layout/ScreenSizeSwitch';
import { CardOffsetContext } from './CardOffsetContext';
import {
  CardBottomLeft,
  CardCenterIcon,
  CardContent,
  LargeCard,
} from './LargeCard';
import { useSeasonContext } from '../../../components/SeasonContext';

type Props = CardStackProps & {
  showLikes?: boolean;
  showName?: boolean;
};

interface CardStackProps {
  cards: CardInGame[];
  /** True for the judge (czar), during the 'reading' phase. */
  canReveal?: boolean;
  /** True for the judge (czar), when selecting winner. */
  canSelect?: boolean;
  selected?: boolean;
  onClick?: () => void;
  /** True if the current player can like this response. */
  canLike?: boolean;
  onClickLike?: () => void;
  likeCount?: number;
  likeIcon?: ReactNode;
  /** True if the stack has the player's like. */
  hasMyLike?: boolean;
  /** How many of the cards are revealed. */
  revealCount?: number;
  /** If true, animate individual cards in stack. */
  animate?: boolean;
  /** Delay before start of animation in seconds. */
  animDelay?: number;
  /** Optional Decorator added to every card. */
  decorator?: (card: CardInGame, index: number) => ReactNode;
  animateLikes?: boolean;
}

/**
 * Vertical card stack. Used for ResponseReading
 */
export function CardStack(props: Props) {
  const {
    cards,
    canReveal,
    canSelect,
    selected,
    onClick,
    canLike,
    onClickLike,
    showLikes,
    likeCount,
    hasMyLike,
    revealCount,
    decorator,
    animateLikes,
  } = props;
  const likeIcon = showLikes ? <LikeIcon cards={cards} /> : null;
  const canRevealClass = canReveal ? 'can-reveal hoverable-card' : '';
  const canSelectClass = canSelect ? 'hoverable-card' : '';
  const selectedClass = selected ? 'selected' : 'unselected';
  const hasManyCards = cards.length > 1;

  function handleClick() {
    if (canReveal && onClick) {
      onClick();
    }
  }
  function handleClickLike() {
    if (canLike && onClickLike) {
      onClickLike();
    }
  }
  return (
    <>
      {hasManyCards ? (
        <ManyCardsStack
          {...props}
          onClick={handleClick}
          onClickLike={handleClickLike}
          likeCount={showLikes ? likeCount : 0}
          likeIcon={likeIcon}
        />
      ) : (
        <div
          className={`${canRevealClass} ${canSelectClass} ${selectedClass}`}
          onClick={handleClick}
        >
          <CardInStack
            card={cards[0]}
            index={0}
            content={cards[0].content}
            revealed={revealCount == null || revealCount > 0}
            selectable={canSelect}
            selected={selected}
            likable={canLike}
            onClickLike={handleClickLike}
            likeCount={showLikes ? likeCount ?? 0 : 0}
            likeIcon={likeIcon}
            hasPlayerLike={hasMyLike}
            decorator={decorator}
            animateLikes={animateLikes}
          />
        </div>
      )}
    </>
  );
}

/** A single response rendered as a stack of multiple cards. */
function ManyCardsStack({
  cards,
  canReveal,
  canSelect,
  selected,
  onClick,
  canLike,
  onClickLike,
  likeCount,
  likeIcon,
  hasMyLike,
  revealCount,
  animate,
  animDelay,
  decorator,
  animateLikes,
}: CardStackProps) {
  // Store height and offset value for each card:
  const [heights] = useState(cards.map(() => 0));
  const [offsets] = useState<Array<number>>(cards.map(() => 0));
  const [finishedMeasuring, setFinishedMeasuring] = useState(false);
  const canRevealClass = canReveal ? 'can-reveal hoverable-card' : '';
  // If selected, the 1.05 scale is already applied to child cards:
  const canSelectClass = canSelect ? 'hoverable-card' : '';
  const selectedClass = selected ? 'selected' : 'unselected';

  // Context to communicate offsets between multiple responses:
  const offsetContext = useContext(CardOffsetContext);
  const shouldAlignGlobalOffsets = useScreenWiderThan(400);

  // After any card is revealed, re-measure:
  const [priorRevealCount, setPriorRevealCount] = useState(revealCount ?? 0);
  if (revealCount != null && revealCount > priorRevealCount) {
    setPriorRevealCount(revealCount);
    setFinishedMeasuring(false);
  }

  /** Updates local offests based on measured heights. */
  function measureOffsets() {
    if (!finishedMeasuring) {
      calculateOffsets(heights);
      if (shouldAlignGlobalOffsets && offsetContext) {
        // Increase offsets to match globals:
        const maxHeights = getMaxItems(heights, offsetContext.heights);
        calculateOffsets(maxHeights);
        // Update global offsets manually to communicate with other responses
        // during the same render:
        maxHeights.forEach((val, i) => {
          offsetContext.heights[i] = val;
        });
        // Trigger rerender in other responses:
        offsetContext.setHeights(maxHeights);
      }
      // All measurement will complete during the first render,
      // so no need to do it again:
      setFinishedMeasuring(true);
    }
  }

  /** Calculates offests from heights */
  function calculateOffsets(heights: number[]) {
    let totalOffset = 0;
    offsets[0] = 0;
    heights.forEach((height, i) => {
      totalOffset += height;
      offsets[i + 1] = totalOffset; // set offset for the next card
    });
  }

  // Whenever another card updates global offsets:
  useEffect(() => {
    if (shouldAlignGlobalOffsets && offsetContext) {
      const maxHeights = getMaxItems(heights, offsetContext.heights);
      calculateOffsets(maxHeights);
    }
  }, [offsetContext]); // only update when global offsets change

  // Overlay multiple cards on top of each other.
  // The "Placeholder" component holds place the size of a card:
  return (
    <div
      className={`game-card-placeholder many-cards ${canRevealClass} ${canSelectClass} ${selectedClass}`}
      style={{
        // Add extra margin below for the overlaid cards:
        // (-18 come from .game-card.overlaid being 2em shorter)
        marginBottom: (offsets.at(-2) ?? 0) - 18,
      }}
      onClick={onClick}
    >
      {/* Cards on top have absolute positioning,
          without interfering with the flow of the rest of the page. */}
      {cards.map((card, i) => {
        const isLastCard = i === cards.length - 1;
        return (
          <CardAnimationWrapper
            key={card.id}
            // full unrevealed stacks are also animated:
            animate={animate ?? revealCount === 0}
            index={i}
            delay={animDelay}
          >
            <CardInStack
              card={card}
              content={card.content}
              isOverlaid={i > 0}
              index={i}
              offset={offsets[i]}
              revealed={revealCount == null || revealCount > i}
              selectable={canSelect}
              selected={selected}
              // Only enable likes on the last card of the stack:
              likable={canLike && isLastCard}
              onClickLike={onClickLike}
              likeCount={isLastCard ? likeCount ?? 0 : 0}
              likeIcon={likeIcon}
              hasPlayerLike={hasMyLike}
              setContentHeight={(height) => {
                heights[i] = height;
                measureOffsets();
              }}
              decorator={decorator}
              animateLikes={animateLikes}
            />
          </CardAnimationWrapper>
        );
      })}
    </div>
  );
}

interface CardProps {
  card: CardInGame;
  content: string;
  revealed: boolean;
  selectable?: boolean;
  selected?: boolean;
  likable?: boolean;
  onClickLike?: () => void;
  likeCount: number;
  likeIcon?: ReactNode;
  hasPlayerLike?: boolean;
  // Overlaid card data:
  isOverlaid?: boolean;
  index: number;
  offset?: number;
  setContentHeight?: (height: number) => void;
  decorator?: (card: CardInGame, index: number) => ReactNode;
  animateLikes?: boolean;
}

/** Individual response card (not a stack of cards)  */
function CardInStack({
  card,
  content,
  revealed,
  selectable,
  selected,
  likable,
  onClickLike,
  likeCount,
  likeIcon,
  hasPlayerLike,
  isOverlaid,
  index,
  offset,
  decorator,
  setContentHeight,
  animateLikes,
}: CardProps) {
  const { isSeason } = useSeasonContext();
  const classes = ['response-reading'];
  if (card.type === 'prompt') classes.push('card-prompt');
  if (card.type === 'response') classes.push('card-response');
  if (isOverlaid) classes.push('overlaid');
  if (selectable) classes.push('selectable');
  if (selected) classes.push('selected');
  classes.push(revealed ? 'revealed' : 'unrevealed');

  const overlayStyle: CSSProperties | undefined = isOverlaid
    ? {
        position: 'absolute',
        top: (offset ?? 0) + (selected ? 4 * index : 0),
      }
    : undefined;

  // Measure content height:
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (setContentHeight && contentRef.current) {
      measure(contentRef.current);
    }
  }, [setContentHeight, contentRef, measure]);

  // Detect resize, e.g. after running Twemoji:
  useEffect(() => {
    if (contentRef.current) {
      const elem = contentRef.current;
      const resizeObserver = new ResizeObserver(() => {
        measure(elem);
      });
      resizeObserver.observe(elem);
      return () => resizeObserver.disconnect(); // clean up
    } else if (!revealed && setContentHeight) {
      // For unrevealed card, report default size:
      setContentHeight(32);
    }
  }, [contentRef, measure, setContentHeight]);

  function measure(elem: HTMLElement) {
    if (setContentHeight) {
      // Guessing padding size:
      const cardPadding = 16;
      setContentHeight(elem.clientHeight + cardPadding);
      // console.log(`Measured "${card.content}": ${elem.clientHeight}`);
    }
  }

  if (revealed) {
    return (
      <LargeCard className={classes.join(' ')} style={overlayStyle}>
        <span ref={contentRef}>
          <CardContent>{content}</CardContent>
        </span>
        {likable && (
          <CardCenterIcon className="like-response-container">
            <div className="like-response-button">
              {isSeason('halloween') ? (
                <Twemoji className="like-response-icon" onClick={onClickLike}>
                  🎃
                </Twemoji>
              ) : isSeason('christmas') ? (
                <Twemoji className="like-response-icon" onClick={onClickLike}>
                  💝
                </Twemoji>
              ) : (
                <IconHeart
                  className="like-response-icon"
                  onClick={onClickLike}
                />
              )}
            </div>
          </CardCenterIcon>
        )}
        {likeCount > 0 && (
          <CardBottomLeft className={hasPlayerLike ? 'has-player-like' : ''}>
            {[...Array(likeCount)].map((_, i) => (
              <LikeAnimationWrapper key={i} index={i} animate={animateLikes}>
                {likeIcon}
              </LikeAnimationWrapper>
            ))}
          </CardBottomLeft>
        )}
        {decorator && decorator(card, index)}
      </LargeCard>
    );
  } else {
    return (
      <LargeCard style={overlayStyle} className={classes.join(' ')}>
        <CardCenterIcon className="reading-unrevealed-icon">?</CardCenterIcon>
      </LargeCard>
    );
  }
}

interface LikeProps {
  cards: CardInGame[];
}

/** Returns a custom icon for likes */
function LikeIcon({ cards }: LikeProps) {
  const { isSeason } = useSeasonContext();
  for (const card of cards) {
    if (card.tags.includes('jew')) {
      return <IconStarOfDavid />;
    }
  }
  for (const card of cards) {
    if (card.tags.includes('csgo')) {
      return <IconHeadshot />;
    }
  }
  for (const card of cards) {
    if (detectDeer(card.content) || card.tags.includes('deer')) {
      return <Twemoji className="emoji-like">🦌</Twemoji>;
    }
  }
  for (const card of cards) {
    if (detectCat(card.content) || card.tags.includes('cat')) {
      return <IconCat className="cat-icon" />;
    }
  }
  for (const card of cards) {
    if (detectLenich(card.content)) {
      if (cards[0].random_index % 2 == 0) {
        return <Twemoji className="emoji-like">👑</Twemoji>;
      } else {
        return <IconCat className="cat-icon" />;
      }
    }
  }
  if (isSeason('halloween')) {
    return <Twemoji className="emoji-like">🎃</Twemoji>;
  } else if (isSeason('christmas')) {
    return <Twemoji className="emoji-like">💝</Twemoji>;
  }
  return <IconHeart className="heart-icon" />;
}

/** Returns an array with the biggest of the 2 numbers. */
function getMaxItems(localItems: number[], globalItems: number[]): number[] {
  const result = new Array<number>();
  const length = Math.max(localItems.length, globalItems.length);
  for (let i = 0; i < length; i++) {
    const maxItem = Math.max(localItems[i] ?? 0, globalItems[i] ?? 0);
    result[i] = maxItem;
  }
  return result;
}

interface AnimationWrapperProps {
  children: ReactNode;
  animate?: boolean;
  index: number;
  delay?: number;
}

/** Animates dealing individual card. */
function CardAnimationWrapper({
  children,
  animate,
  index,
  delay,
}: AnimationWrapperProps) {
  if (!animate) {
    return children;
  }
  return (
    <motion.div
      style={{ position: index > 0 ? 'absolute' : 'relative' }}
      initial={{ top: -10, opacity: 0 }}
      animate={{ top: 0, opacity: 1 }}
      transition={{ delay: (delay ?? 0) + (index ?? 0) * 0.2, duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

/** Animates showing likes. */
function LikeAnimationWrapper({
  children,
  animate,
  index,
  delay,
}: AnimationWrapperProps) {
  if (!animate) {
    return <span className="like">{children}</span>;
  }
  return (
    <motion.span
      className="like"
      initial={{ scale: 0, rotate: ((index % 5) - 2) * 30 }}
      animate={{ scale: 1, rotate: 1 }}
      transition={{
        delay: (delay ?? 0.2) + index * 0.15,
        type: 'spring',
        stiffness: 900,
        damping: 20,
      }}
    >
      {children}
    </motion.span>
  );
}
