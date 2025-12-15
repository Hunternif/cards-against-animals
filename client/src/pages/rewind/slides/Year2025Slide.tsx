import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { AnimatedTimeCounter } from '../components/AnimatedTimeCounter';

export function Year2025Slide({ userStats, statsContainer }: SlideProps) {
  const stats = userStats.year2025;
  const globalStats = statsContainer.yearMap.get(2025)?.globalStats;

  if (!stats) {
    return (
      <div className="slide-content slide-year">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="no-data-message"
        >
          <h2>2025</h2>
          <p>You didn't play in 2025. Maybe next year!</p>
        </motion.div>
      </div>
    );
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="slide-content slide-year slide-2025">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <div className="year-title">2025</div>
        <p className="subtitle">Your year in review</p>
      </motion.div>

      <motion.div
        className="year-stats-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="stat-card"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="stat-number">{stats.total_games}</div>
          <div className="stat-label">Games</div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
        >
          <div className="stat-number">{stats.total_wins}</div>
          <div className="stat-label">Wins</div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
        >
          <div className="stat-number">{stats.total_likes_received}</div>
          <div className="stat-label">Likes</div>
        </motion.div>
      </motion.div>

      <motion.div
        className="stat-card highlight"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9, type: 'spring' }}
      >
        <div className="stat-number">
          <AnimatedTimeCounter
            timeMs={stats.total_time_played_ms}
            duration={1}
            delay={0.9}
          />
        </div>
        <div className="stat-label">Time Played</div>
      </motion.div>

      {stats.first_time_played && (
        <motion.p
          className="timeline-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          First game: <strong>{formatDate(stats.first_time_played)}</strong>
        </motion.p>
      )}

      {globalStats && (
        <motion.div
          className="global-context"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <p>
            You were one of <strong>{globalStats.unique_players}</strong>{' '}
            players in 2025!
          </p>
        </motion.div>
      )}
    </div>
  );
}
