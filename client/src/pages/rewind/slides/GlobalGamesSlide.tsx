import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { IconHeartInline, IconStarInline } from '../../../components/Icons';
import { Twemoji } from '../../../components/Twemoji';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { AnimatedTimeCounter } from '../components/AnimatedTimeCounter';
import { MotionSlideIn } from '../components/animations';
import { SlideProps } from './SlideProps';

export function GlobalGamesSlide({ statsContainer }: SlideProps) {
  const allUsers = statsContainer.yearMap.get('all_time')?.userStats ?? [];
  const globalStats = statsContainer.yearMap.get('all_time')?.globalStats;
  if (!globalStats) {
    return <p>No global stats</p>;
  }

  const totalDiscards = useMemo(
    () => allUsers.reduce((total, u) => total + u.total_discards, 0),
    [statsContainer],
  );

  const totalLikes = useMemo(
    () => allUsers.reduce((total, u) => total + u.total_likes_received, 0),
    [statsContainer],
  );

  return (
    <div className="slide-content slide-global-games">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Global Stats</h2>
      </motion.div>

      <MotionSlideIn left className="stat-row" delay={0.6}>
        <div className="stat-number">
          <AnimatedCounter
            value={globalStats.total_games}
            duration={1}
            delay={0.7}
          />
        </div>
        <div className="stat-label">Games played</div>
      </MotionSlideIn>

      <MotionSlideIn left className="stat-row" delay={2.0}>
        <div className="stat-number">
          {/* <IconStarInline /> */}
          <Twemoji>⭐</Twemoji>
          <AnimatedCounter
            value={globalStats.total_turns}
            duration={1.5}
            delay={2.1}
          />
        </div>
        <div className="stat-label">Turns played</div>
      </MotionSlideIn>

      <MotionSlideIn left className="stat-row" delay={3.8}>
        <div className="stat-number">
          <Twemoji>🔄</Twemoji>
          <AnimatedCounter value={totalDiscards} duration={2.5} delay={3.9} />
        </div>
        <div className="stat-label">Cards discarded</div>
      </MotionSlideIn>

      <MotionSlideIn left className="stat-row" delay={6.5}>
        <div className="stat-number">
          <IconHeartInline />
          <AnimatedCounter value={totalLikes} duration={4} delay={6.6} />
        </div>
        <div className="stat-label">Likes given</div>
      </MotionSlideIn>

      <motion.div
        className="stat-row"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 11.0, type: 'spring', stiffness: 100, damping: 5 }}
      >
        <div className="stat-number">
          <Twemoji>💀</Twemoji>
          <AnimatedTimeCounter
            timeMs={globalStats.total_time_played_ms * 10}
            duration={4}
            delay={11.1}
          />
        </div>
        <div className="stat-label" style={{ marginLeft: '0.5rem' }}>
          Spent Playing
        </div>
      </motion.div>
    </div>
  );
}
