import { motion } from 'framer-motion';
import { SlideProps } from './SlideProps';

export function AllTimeTeammatesSlide({ userStats }: SlideProps) {
  const stats = userStats.allTime;

  if (!stats) {
    return <div className="slide-content">No data available</div>;
  }

  const topTeammates = stats.top_teammates.slice(0, 5);

  return (
    <div className="slide-content slide-all-time-teammates">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Your Squad</h2>
        <p className="subtitle">The people you played with most</p>
      </motion.div>

      {topTeammates.length > 0 ? (
        <div className="teammates-list">
          {topTeammates.map((teammate, index) => (
            <motion.div
              key={teammate.uid}
              className={`teammate-card ${index === 0 ? 'top-teammate' : ''}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="teammate-rank">#{index + 1}</div>
              <div className="teammate-info">
                <div className="teammate-name">{teammate.name}</div>
                <div className="teammate-games">
                  {teammate.games} game{teammate.games !== 1 ? 's' : ''} together
                </div>
              </div>
              {index === 0 && (
                <motion.div
                  className="best-friend-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: 'spring' }}
                >
                  👥
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.p
          className="no-data-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          You played solo! Consider inviting some friends next time.
        </motion.p>
      )}
    </div>
  );
}
