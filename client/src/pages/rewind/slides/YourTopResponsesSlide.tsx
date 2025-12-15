import { motion } from 'framer-motion';
import { PopularResponsesDisplay } from '../components/PopularResponsesDisplay';
import { SlideProps } from './SlideProps';

export function YourTopResponsesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

  return (
    <div className="slide-content slide-top-responses">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Most Liked Responses</h2>
      </motion.div>

      {stats.top_liked_responses.length > 0 && (
        <motion.div
          className="most-liked-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          <PopularResponsesDisplay
            responses={stats.top_liked_responses}
            delay={0.6}
          />
        </motion.div>
      )}
    </div>
  );
}
