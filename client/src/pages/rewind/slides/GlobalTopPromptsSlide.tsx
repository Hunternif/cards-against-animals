import { motion } from 'framer-motion';
import { PopularCardsDisplay } from '../components/PopularCardsDisplay';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SlideProps } from './SlideProps';

export function GlobalTopPromptsSlide({ statsContainer }: SlideProps) {
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  const topPrompts = globalStats?.top_prompts ?? [];

  return (
    <div className="slide-content slide-global-top-prompts">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Toughest Questions</h2>
        <p className="subtitle">Most played prompts across all players</p>
      </motion.div>

      {topPrompts.length > 0 && (
        <PopularCardsDisplay
          cards={topPrompts}
          isPrompt={true}
          maxCards={10}
        />
      )}

      {/* {globalStats && globalStats.total_games && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          These questions appeared in{' '}
          <strong>
            <AnimatedCounter
              value={globalStats.total_games}
              delay={1.2}
            />
          </strong>{' '}
          games, challenging players to find the best answers
        </motion.p>
      )} */}
    </div>
  );
}
