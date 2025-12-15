import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';
import { Twemoji } from '../../../components/Twemoji';
import { IconHeartInline } from '../../../components/Icons';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { PlayerAvatar } from '../../../components/PlayerAvatar';

export function YourWinsSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;
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
        className="avatar-container"
        initial={{ scale: 0, rotate: -360 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <PlayerAvatar player={stats.player_in_lobby_refs[0]} />
        <Laurel delay={0.7 + 0.15} />
        <Laurel delay={0.7 + 0.0} />
        <Laurel delay={0.7 + 0.1} />
        <Laurel delay={0.7 + 0.05} />
      </motion.div>

      <motion.div
        className="stat-card highlight stat-row"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      >
        <div className="stat-number">
          <Twemoji className="icon-trophy">🏆</Twemoji>
          <AnimatedCounter
            value={stats.total_wins}
            duration={stats.total_wins * 0.05}
            delay={0.8}
          />
        </div>
        <div className="stat-label">Total Wins</div>
      </motion.div>

      <motion.div
        className="stat-grid"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.9 }}
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
        transition={{ delay: 2.5 }}
      >
        <div className="stat-number">
          <IconHeartInline />
          <AnimatedCounter
            value={stats.total_likes_received}
            duration={stats.total_likes_received * 0.05}
            delay={2.0}
          />
        </div>
        <div className="stat-label">Likes Received</div>
      </motion.div>

      {stats.average_score_per_game > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0 }}
        >
          You averaged{' '}
          <strong>{stats.average_score_per_game.toFixed(1)}</strong> points per
          game!
        </motion.p>
      )}
    </div>
  );
}

interface LaurelProps {
  delay?: number;
}
function Laurel({ delay }: LaurelProps) {
  return (
    <motion.div
      className="laurel"
      initial={{ scale: 0, x: '-50%', y: '50%' }}
      animate={{ scale: 1, x: 0, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 500, damping: 15 }}
    >
      <Twemoji>🌿</Twemoji>
    </motion.div>
  );
}
