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
        <h2>Your Top Responses</h2>
      </motion.div>

      {stats.top_liked_responses.length > 0 && (
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
          <PopularResponsesDisplay responses={stats.top_liked_responses} />
        </motion.div>
      )}
    </div>
  );
}
