import { useState } from 'react';
import {
  fetchUserStatistics,
  UserStats,
  FetchProgressInfo,
} from '../../api/stats-api';
import { GameButton } from '../../components/Buttons';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { ProgressBar } from '../../components/ProgressBar';
import '../../scss/components/progress-bar.scss';

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FetchProgressInfo | null>(null);

  const handleFetchStats = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      const data = await fetchUserStatistics((progressInfo) => {
        setProgress(progressInfo);
      });
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch statistics',
      );
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <AdminSubpage
      title="Statistics"
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton onClick={handleFetchStats} loading={loading}>
              Fetch User Statistics
            </GameButton>
            {stats.length > 0 && (
              <span className="stats-summary">{stats.length} users</span>
            )}
          </div>
          {progress && (
            <div className="stats-progress">
              <p className="progress-text">
                Loading lobby data: {progress.current} / {progress.total}
              </p>
              <ProgressBar value={progress.percentage} />
            </div>
          )}
        </>
      }
    >
      <div className="user-stats">
        {error && <div className="error-message">{error}</div>}

        {stats.length > 0 && (
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
                <th>UID</th>
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
                  <CounterRow val={`${(stat.win_rate * 100).toFixed(1)}%`} />
                  <CounterRow val={stat.total_score} />
                  <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                  <CounterRow val={stat.total_likes_received} />
                  <CounterRow val={stat.total_discards} />
                  <td className="player-uid">{stat.uid}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

function PlayerNameCell({ stat }: { stat: UserStats }) {
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
