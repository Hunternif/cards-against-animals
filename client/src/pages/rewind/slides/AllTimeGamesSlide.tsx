import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { AnimatedCounter } from '../AnimatedCounter';
import { MotionSlideIn } from '../animations';
import { AnimatedTimeCounter } from '../AnimatedTimeCounter';

export function AllTimeGamesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

  if (!stats) {
    return <div className="slide-content">No data available</div>;
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="slide-content slide-all-time-games">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Journey</h2>
      </motion.div>

      <MotionSlideIn left className="stat-row" delay={0.4}>
        <div className="stat-number">
          <AnimatedCounter value={stats.total_games} duration={0.5} delay={0.6} />
        </div>
        <div className="stat-label">Games Played</div>
      </MotionSlideIn>

      <MotionSlideIn left className="stat-row" delay={1.2}>
        <div className="stat-number">
          <AnimatedCounter
            value={stats.total_turns_played}
            duration={0.5}
            delay={1.4}
          />
        </div>
        <div className="stat-label">Turns Played</div>
      </MotionSlideIn>

      <motion.div
        className="stat-card"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2.0, type: 'spring', stiffness: 200 }}
      >
        <div className="stat-number">
          <AnimatedTimeCounter
            timeMs={stats.total_time_played_ms}
            duration={1.5}
            delay={2.2}
          />
        </div>
        <div className="stat-label">Time Spent Playing</div>
      </motion.div>

      <motion.div
        className="timeline-info"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 3.4, duration: 0.3 }}
      >
        From <strong>{formatDate(stats.first_time_played)}</strong>
        <br />
        to <strong>{formatDate(stats.last_time_played)}</strong>
      </motion.div>
    </div>
  );
}
