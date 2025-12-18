import { motion } from 'framer-motion';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { SlideProps } from './SlideProps';
import { useMemo } from 'react';
import { IconHeartInline } from '../../../components/Icons';

export function GlobalLeaderboardLikesSlide({ statsContainer }: SlideProps) {
  const allUsers = statsContainer.yearMap.get('all_time')?.userStats ?? [];

  const leaderboard = useMemo(
    () =>
      [...allUsers]
        // .filter((u) => !u.is_bot) // Filter out bots
        .sort((a, b) => b.total_likes_received - a.total_likes_received)
        .slice(0, 7),
    [statsContainer],
  );

  const totalLikes = useMemo(
    () => allUsers.reduce((total, u) => total + u.total_likes_received, 0),
    [statsContainer],
  );

  return (
    <div className="slide-content slide-global-leaderboard slide-global-leaderboard-likes">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Audience Favorites</h2>
        {/* <p className="subtitle">Top players by wins</p> */}
      </motion.div>

      {leaderboard.length > 0 ? (
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => {
            const avatar = player.player_in_lobby_refs?.at(0);
            const reverseOrder = leaderboard.length - index - 1;
            return (
              <motion.div
                key={player.uid}
                className={`leaderboard-row ${index === 0 ? 'top-player' : ''}`}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + reverseOrder * 0.2 }}
              >
                <div className="rank-badge">
                  {/* {index === 0 && <span className="rank-icon">🏆</span>}
                  {index === 1 && <span className="rank-icon">🥈</span>}
                  {index === 2 && <span className="rank-icon">🥉</span>} */}
                  {/* {index >= 3 && ( */}
                  <span className="rank-number">#{index + 1}</span>
                  {/* )} */}
                </div>

                <div className="player-info">
                  {avatar && <PlayerAvatar player={avatar} />}
                  <div className="player-details">
                    <div className="player-name">{player.name}</div>
                    <div className="player-games">
                      {player.total_games} game
                      {player.total_games !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="player-likes">
                  <div className="stats-number">
                    <IconHeartInline />
                    <AnimatedCounter
                      value={player.total_wins}
                      delay={0.6 + reverseOrder * 0.2}
                      duration={Math.min(
                        player.total_wins * 0.05,
                        0.5 + reverseOrder * 0.1,
                      )}
                    />
                  </div>
                  {/* <div className="wins-label">wins</div> */}
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
          No leaderboard data available yet
        </motion.p>
      )}

      {allUsers.length > 0 && (
        <motion.p
          className="fun-fact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 + leaderboard.length * 0.2 }}
        >
          <strong>
            <AnimatedCounter
              value={totalLikes}
              duration={Math.min(3, totalLikes * 0.05)}
              delay={1.1 + leaderboard.length * 0.2}
            />
          </strong>{' '}
          total likes were given
        </motion.p>
      )}
    </div>
  );
}
