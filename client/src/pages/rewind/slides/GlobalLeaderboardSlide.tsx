import { motion } from 'framer-motion';
import { PlayerAvatar } from '../../../components/PlayerAvatar';
import { AnimatedCounter } from '../AnimatedCounter';
import { SlideProps } from './SlideProps';

export function GlobalLeaderboardSlide({ statsContainer }: SlideProps) {
  const allUsers = statsContainer.yearMap.get('all_time')?.userStats ?? [];
  
  // Sort by wins and take top 10
  const leaderboard = [...allUsers]
    .filter(u => !u.is_bot) // Filter out bots
    .sort((a, b) => b.total_wins - a.total_wins)
    .slice(0, 7);

  return (
    <div className="slide-content slide-global-leaderboard">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="slide-header"
      >
        <h2>Champions</h2>
        <p className="subtitle">Top 10 players by wins</p>
      </motion.div>

      {leaderboard.length > 0 ? (
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => {
            const avatar = player.player_in_lobby_refs?.at(0);
            return (
              <motion.div
                key={player.uid}
                className={`leaderboard-row ${index === 0 ? 'top-player' : ''}`}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.15 }}
              >
                <div className="rank-badge">
                  {index === 0 && <span className="rank-icon">🏆</span>}
                  {index === 1 && <span className="rank-icon">🥈</span>}
                  {index === 2 && <span className="rank-icon">🥉</span>}
                  {index >= 3 && <span className="rank-number">#{index + 1}</span>}
                </div>

                <div className="player-info">
                  {avatar && <PlayerAvatar player={avatar} />}
                  <div className="player-details">
                    <div className="player-name">{player.name}</div>
                    <div className="player-games">
                      <AnimatedCounter
                        value={player.total_games}
                        delay={0.6 + index * 0.15}
                      />{' '}
                      game{player.total_games !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="player-wins">
                  <div className="wins-number">
                    <AnimatedCounter
                      value={player.total_wins}
                      delay={0.6 + index * 0.15}
                    />
                  </div>
                  <div className="wins-label">wins</div>
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
          transition={{ delay: 1 }}
        >
          <strong>
            <AnimatedCounter
              value={allUsers.filter(u => !u.is_bot).length}
              delay={1.2}
            />
          </strong>{' '}
          players have competed for glory
        </motion.p>
      )}
    </div>
  );
}
