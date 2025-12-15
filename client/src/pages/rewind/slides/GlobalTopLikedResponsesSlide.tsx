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
        <h2>Most Liked Answers</h2>
        <p className="subtitle">Responses that got the most likes</p>
      </motion.div>

      {topLikedResponses.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.5,
            type: 'spring',
            stiffness: 700,
            damping: 20,
          }}
        >
          <PopularResponsesDisplay
            responses={topLikedResponses}
            showPlayer
            users={users}
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
