import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { Twemoji } from '../../../components/Twemoji';
import { IconHeartInline } from '../../../components/Icons';
import { AnimatedCounter } from '../AnimatedCounter';

export function AllTimeWinsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

  if (!stats) {
    return <div className="slide-content">No data available</div>;
  }

  const winPercentage = Math.round((stats.win_rate || 0) * 100);

  return (
    <div className="slide-content slide-all-time-wins">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Winning Streak</h2>
      </motion.div>

      <motion.div
        className="trophy-container"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
      >
        <div className="trophy-icon">
          <Twemoji>🏆</Twemoji>
        </div>
      </motion.div>

      <motion.div
        className="stat-card highlight stat-row"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
      >
        <div className="stat-number">
          <AnimatedCounter value={stats.total_wins} duration={1} delay={0.8} />
        </div>
        <div className="stat-label">Total Wins</div>
      </motion.div>

      <motion.div
        className="stat-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="stat-card small">
          <div className="stat-number">{winPercentage}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card small">
          <div className="stat-number">{stats.total_score}</div>
          <div className="stat-label">Total Score</div>
        </div>
      </motion.div>

      <motion.div
        className="stat-card small"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <div className="stat-number">{stats.total_likes_received}</div>
        <div className="stat-label">
          Likes Received <IconHeartInline />
        </div>
      </motion.div>

      {stats.average_score_per_game > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          You averaged{' '}
          <strong>{stats.average_score_per_game.toFixed(1)}</strong> points per
          game!
        </motion.p>
      )}
    </div>
  );
}
