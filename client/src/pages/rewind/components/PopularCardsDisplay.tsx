import {
  ResponseCardStats,
  PromptCardStats,
  ResponseCardInGame,
  PromptCardInGame,
  CardInGame,
} from '@shared/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CardStack } from '../../lobby-screens/game-components/CardStack';

type ResponseCardItem = { card: ResponseCardStats; count: number };
type PromptCardItem = { prompt: PromptCardStats; count: number };

interface PopularCardsDisplayProps {
  cards: ResponseCardItem[] | PromptCardItem[];
  isPrompt?: boolean;
  maxCards?: number;
}

/** The layout is visually specific, card offets need to be adjusted. */
function overrideCardHeight(
  card: CardInGame,
  height: number,
  revealed: boolean,
  index: number,
): number {
  if (!revealed) {
    return height;
  }
  if (card instanceof PromptCardInGame && card.id.startsWith('haiku')) {
    return 50;
    // if (index == 1) {
    // return Math.min(10 + 10 * card.pick + 50 * index, height);
    // } else if (index == 2) {
    //   return
    // }
  } else {
    if (index == 0) {
      return Math.max(50, height);
    }
  }
  return height;
}

function toCardInGame(cardStats: ResponseCardStats): ResponseCardInGame {
  return new ResponseCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0,
    cardStats.content,
    0,
    cardStats.tags ?? [],
    cardStats.action,
  );
}

function toPromptCardInGame(cardStats: PromptCardStats): PromptCardInGame {
  return new PromptCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0,
    cardStats.content,
    cardStats.pick,
    0,
    cardStats.tags ?? [],
  );
}

function CardCount({ count }: { count: number }) {
  let tier = 'low';
  if (count > 2) {
    tier = 'mid';
  }
  if (count > 4) {
    tier = 'high';
  }
  if (count > 6) {
    tier = 'ultra';
  }
  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 900, damping: 20 }}
      className={`card-count tier-${tier}`}
    >
      ×{count}
    </motion.div>
  );
}

/** Displays up to 10 cards arranged on the screen, revealed when clicked. */
export function PopularCardsDisplay({
  cards,
  isPrompt = false,
  maxCards = 7,
}: PopularCardsDisplayProps) {
  const displayCards = cards.slice(0, maxCards);
  const [revealCount, setRevealCount] = useState(0);

  if (displayCards.length === 0) {
    return (
      <motion.p
        className="no-data-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        No data available
      </motion.p>
    );
  }

  const cardItems = displayCards.map((item) => {
    if (isPrompt) {
      const promptItem = item as PromptCardItem;
      return toPromptCardInGame(promptItem.prompt);
    } else {
      const responseItem = item as ResponseCardItem;
      return toCardInGame(responseItem.card);
    }
  });

  return (
    <div className="rewind-card-stack-container">
      <motion.div
        className="rewind-card-wrapper"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <CardStack
          animate
          animDelay={0.6}
          cards={cardItems}
          canReveal={revealCount < displayCards.length}
          revealCount={revealCount}
          onClick={() => setRevealCount(revealCount + 1)}
          decorator={(_, i) => <CardCount count={displayCards[i].count} />}
          overrideCardHeight={overrideCardHeight}
        />
      </motion.div>
    </div>
  );
}
