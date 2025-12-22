import { motion } from 'framer-motion';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { SlideProps } from './SlideProps';

export function YourTopResponseCardsSlide({ userStats }: SlideProps) {
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
          excludeOnes
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
