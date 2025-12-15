import { motion } from 'framer-motion';
import { useState } from 'react';
import { AnimatedCounter } from '../AnimatedCounter';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { SlideProps } from './SlideProps';

export function TopCardsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  const topCards = stats.top_cards_played;

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
        <PopularCardsDisplay
          cards={topCards}
          isPrompt={false}
          maxCards={10}
          title="Popular Responses"
        />
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
