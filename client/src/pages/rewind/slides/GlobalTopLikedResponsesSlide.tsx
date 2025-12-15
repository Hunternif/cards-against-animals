import { motion } from 'framer-motion';
import { PopularResponsesDisplay } from '../components/PopularResponsesDisplay';
import { SlideProps } from './SlideProps';

export function GlobalTopLikedResponsesSlide({ statsContainer }: SlideProps) {
  // Use global stats directly for most liked responses
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  const users = statsContainer.yearMap.get('all_time')?.userStats;
  const topLikedResponses = globalStats?.top_liked_responses ?? [];

  return (
    <div className="slide-content slide-global-top-liked-responses">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Most Liked Responses</h2>
      </motion.div>

      {topLikedResponses.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          <PopularResponsesDisplay
            responses={topLikedResponses}
            showPlayer
            users={users}
            delay={0.6}
          />
        </motion.div>
      )}

      {topLikedResponses.length === 0 && (
        <motion.p
          className="no-data-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          No liked responses data available yet
        </motion.p>
      )}
    </div>
  );
}
