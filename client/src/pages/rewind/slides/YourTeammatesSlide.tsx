import { motion } from 'framer-motion';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { SlideProps } from './SlideProps';

export function YourTeammatesSlide({
  userStats,
  statsContainer,
}: SlideProps) {
  const stats = userStats.allTime;
  const allUsers = statsContainer.yearMap.get('all_time')?.userStats;
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
          {topTeammates.map((teammate, index) => {
            const player = allUsers
              ?.find((u) => u.uid === teammate.uid)
              ?.player_in_lobby_refs?.at(0);
            return (
              <motion.div
                key={teammate.uid}
                className={`teammate-card ${index === 0 ? 'top-teammate' : ''}`}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.3 }}
              >
                <div className="teammate-rank">#{index + 1}</div>
                {player && <PlayerAvatar player={player} />}
                <div className="teammate-info">
                  <div className="teammate-name">{teammate.name}</div>
                  <div className="teammate-games">
                    {teammate.games} game{teammate.games !== 1 ? 's' : ''}{' '}
                    together
                  </div>
                </div>
              </motion.div>
            );
          })}
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
