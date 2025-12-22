import { motion } from 'framer-motion';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SlideProps } from './SlideProps';

export function GlobalTopResponseCardsSlide({ statsContainer }: SlideProps) {
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  const topCards = globalStats?.top_response_cards ?? [];

  return (
    <div className="slide-content slide-global-top-response-cards">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Everyone's Favorites</h2>
        <p className="subtitle">
          Most played response cards across all players
        </p>
      </motion.div>

      {topCards.length > 0 && (
        <PopularCardsDisplay
          cards={topCards}
          isPrompt={false}
          maxCards={10}
          excludeOnes
        />
      )}

      {/* {allUsers.length > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          These were the most popular response cards among{' '}
          <strong>
            <AnimatedCounter
              value={allUsers.filter(u => !u.is_bot).length}
              delay={1.2}
            />
          </strong>{' '}
          players
        </motion.p>
      )} */}
    </div>
  );
}
