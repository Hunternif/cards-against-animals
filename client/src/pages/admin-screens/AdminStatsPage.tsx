import { useState } from 'react';
import { fetchUserStatistics, UserStats } from '../../api/stats-api';
import { GameButton } from '../../components/Buttons';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { ScrollContainer } from '../../components/layout/ScrollContainer';

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserStatistics();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminSubpage title="Statistics">
      <div className="user-stats">
        <div className="stats-controls">
          <GameButton onClick={handleFetchStats} loading={loading}>
            Fetch User Statistics
          </GameButton>
          {stats.length > 0 && (
            <span className="stats-summary">
              {stats.length} users
            </span>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {stats.length > 0 && (
          <ScrollContainer scrollLight className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Games</th>
                  <th>Turns</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Total Score</th>
                  <th>Avg Score</th>
                  <th>Likes</th>
                  <th>Discards</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => (
                  <tr key={stat.uid}>
                    <td className="player-name">
                      <PlayerNameCell stat={stat} />
                    </td>
                    <CounterRow val={stat.total_games} />
                    <CounterRow val={stat.total_turns_played} />
                    <CounterRow val={stat.total_wins} />
                    <CounterRow val={`${(stat.win_rate * 100).toFixed(0)}%`}/>
                    <CounterRow val={stat.total_score} />
                    <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                    <CounterRow val={stat.total_likes_received} />
                    <CounterRow val={stat.total_discards} />
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollContainer>
        )}
      </div>
    </AdminSubpage>
  );
}

function CounterRow({ val }: { val: number | string }) {
  const classes = new Array<string>();
  classes.push('col-counter');
  if (val === 0) classes.push('empty');
  return <td className={classes.join(' ')}>{val}</td>;
}

function PlayerNameCell({stat}: {stat: UserStats}) {
  const player = stat.playerInLobbyRefs.at(-1);
  const names = Array.from(new Set(stat.playerInLobbyRefs.map((p) => p.name)));
  if (!player) return <i>Unknown</i>;
  return (
    <>
    <PlayerAvatar player={player} />
    {names.join(', ')}
    </>
  );
}