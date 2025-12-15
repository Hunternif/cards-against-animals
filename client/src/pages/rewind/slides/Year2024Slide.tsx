import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { AnimatedTimeCounter } from '../components/AnimatedTimeCounter';

export function Year2024Slide({ userStats, statsContainer }: SlideProps) {
  const stats = userStats.year2024;
  const globalStats = statsContainer.yearMap.get(2024)?.globalStats;

  if (!stats) {
    return (
      <div className="slide-content slide-year">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="no-data-message"
        >
          <h2>2024</h2>
          <p>You didn't play in 2024.</p>
        </motion.div>
      </div>
    );
  }

  // Find most active month
  let topMonth = '';
  let topMonthGames = 0;
  if (stats.games_per_month.size > 0) {
    for (const [month, games] of stats.games_per_month.entries()) {
      if (games > topMonthGames) {
        topMonthGames = games;
        topMonth = month;
      }
    }
  }

  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="slide-content slide-year slide-2024">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <div className="year-title">2024</div>
        <p className="subtitle">Where it all began</p>
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

      {topMonth && (
        <motion.p
          className="timeline-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Most active in <strong>{formatMonth(topMonth)}</strong>
          <br />
          with {topMonthGames} game{topMonthGames !== 1 ? 's' : ''}
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
            Joined <strong>{globalStats.unique_players}</strong> players in
            2024!
          </p>
        </motion.div>
      )}
    </div>
  );
}
