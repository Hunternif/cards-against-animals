import { ResponseCardInGame, ResponseCardStats } from '@shared/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { CardStack } from '../../lobby-screens/game-components/CardStack';
import { AnimatedCounter } from '../AnimatedCounter';
import { SlideProps } from './SlideProps';

function toCardInGame(cardStats: ResponseCardStats): ResponseCardInGame {
  return new ResponseCardInGame(
    cardStats.id,
    cardStats.deck_id,
    cardStats.card_id_in_deck,
    0, // random_index - not needed for display
    cardStats.content,
    0, // rating - not needed for display
    cardStats.tags ?? [],
    cardStats.action,
  );
}

export function TopCardsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  const topCards = stats.top_cards_played.slice(0, 7);
  const [revealCount, setRevealCount] = useState(0);

  return (
    <div className="slide-content slide-top-cards">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Favorite Cards</h2>
      </motion.div>

      {topCards.length > 0 && (
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
              cards={topCards.map(({ card }) => toCardInGame(card))}
              canReveal={revealCount < topCards.length}
              revealCount={revealCount}
              onClick={() => setRevealCount(revealCount + 1)}
              decorator={(card, i) => <CardCount count={topCards[i].count} />}
            />
          </motion.div>
        </div>
      )}

      {stats.total_discards > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + 0.2 * topCards.length }}
        >
          You discarded{' '}
          <strong>
            <AnimatedCounter
              value={stats.total_discards}
              delay={0.7 + 0.2 * topCards.length}
            />
          </strong>{' '}
          cards looking for the perfect answer
        </motion.p>
      )}
    </div>
  );
}

function CardCount({ count }: { count: number }) {
  let tier = 'low';
  if (count > 1) {
    tier = 'mid';
  }
  if (count > 2) {
    tier = 'high';
  }
  if (count > 3) {
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
