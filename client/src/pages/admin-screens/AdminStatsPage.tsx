import { useState } from 'react';
import {
  fetchAllLobbyData,
  FetchProgressInfo,
  parseUserStatistics,
  UserStats,
} from '../../api/stats-api';
import { GameButton } from '../../components/Buttons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { ProgressBar } from '../../components/ProgressBar';
import '../../scss/components/progress-bar.scss';
import { GameLobby } from '../../shared/types';
import { AdminSubpage } from './admin-components/AdminSubpage';

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );

  const handleFetchLobbyData = async () => {
    setLoadingData(true);
    setError(null);
    setFetchProgress(null);
    try {
      const lobbies = await fetchAllLobbyData((progressInfo) => {
        setFetchProgress(progressInfo);
      });
      setGameData(lobbies);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch lobby data',
      );
      console.error('Error fetching lobby data:', err);
    } finally {
      setLoadingData(false);
      setFetchProgress(null);
    }
  };

  const handleParseStats = async () => {
    if (!gameData) return;

    setParsing(true);
    setError(null);
    try {
      const data = await parseUserStatistics(gameData);
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to parse statistics',
      );
      console.error('Error parsing stats:', err);
    } finally {
      setParsing(false);
    }
  };

  return (
    <AdminSubpage
      title="Statistics"
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton onClick={handleFetchLobbyData} loading={loadingData}>
              Fetch Lobby Data
            </GameButton>
            <GameButton
              onClick={handleParseStats}
              loading={parsing}
              disabled={!gameData}
            >
              Parse Statistics
            </GameButton>
            {gameData && (
              <span className="stats-summary">
                {gameData.length} games loaded
              </span>
            )}
            {stats.length > 0 && (
              <span className="stats-summary">{stats.length} users</span>
            )}
          </div>
          {fetchProgress && (
            <div className="stats-progress">
              <p className="progress-text">
                Loading lobby data: {fetchProgress.current} /{' '}
                {fetchProgress.total}
              </p>
              <ProgressBar value={fetchProgress.percentage} />
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
