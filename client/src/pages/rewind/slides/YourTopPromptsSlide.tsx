import { motion } from 'framer-motion';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { SlideProps } from './SlideProps';

export function YourTopPromptsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
  const topCards = stats.top_prompts_played;

  return (
    <div className="slide-content slide-top-cards">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Favorite Prompts</h2>
      </motion.div>

      {topCards.length > 0 && (
        <PopularCardsDisplay
          cards={topCards}
          isPrompt={true}
          maxCards={10}
          excludeOnes
        />
      )}

      {/* {stats.total_discards > 0 && (
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
      )} */}
    </div>
  );
}
