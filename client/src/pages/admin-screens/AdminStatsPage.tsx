import { useState } from 'react';
import {
  fetchAllLobbyData,
  FetchProgressInfo,
  parseUserStatistics,
  UserStats,
  mergeUserStats,
} from '../../api/stats-api';
import { GameButton } from '../../components/Buttons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler } from '../../hooks/data-hooks';
import '../../scss/components/progress-bar.scss';
import { GameLobby } from '../../shared/types';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { Checkbox } from '../../components/Checkbox';

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [mergeName, setMergeName] = useState('');

  const [handleFetchData, fetching] = useHandler(async () => {
    setFetchProgress(null);
    const lobbies = await fetchAllLobbyData((progressInfo) => {
      setFetchProgress(progressInfo);
    });
    setGameData(lobbies);
    setFetchProgress(null);
  }, []);

  const [handleParseStats, parsing] = useHandler(async () => {
    if (!gameData) return;
    const data = await parseUserStatistics(gameData);
    setStats(data);
  }, [gameData]);

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(uid)) {
      newSelection.delete(uid);
    } else {
      newSelection.add(uid);
    }
    setSelectedUsers(newSelection);
  };

  const handleMergeUsers = () => {
    if (selectedUsers.size < 2) {
      alert('Please select at least 2 users to merge');
      return;
    }

    const usersToMerge = stats.filter((s) => selectedUsers.has(s.uid));
    const primaryUser = usersToMerge[0];
    const nameToUse = mergeName.trim() || primaryUser.name;

    const merged = mergeUserStats(usersToMerge, primaryUser.uid, nameToUse);

    // Remove merged users and add the combined one
    const newStats = stats.filter((s) => !selectedUsers.has(s.uid));
    newStats.push(merged);
    newStats.sort((a, b) => b.total_games - a.total_games);

    setStats(newStats);
    setSelectedUsers(new Set());
    setMergeMode(false);
    setMergeName('');
  };

  const cancelMerge = () => {
    setMergeMode(false);
    setSelectedUsers(new Set());
    setMergeName('');
  };

  return (
    <AdminSubpage
      title="Statistics"
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton onClick={handleFetchData} loading={fetching}>
              Fetch Lobby Data
            </GameButton>
            <GameButton
              onClick={handleParseStats}
              loading={parsing}
              disabled={!gameData}
            >
              Parse Statistics
            </GameButton>
            {stats.length > 0 && !mergeMode && (
              <GameButton onClick={() => setMergeMode(true)}>
                Merge Users
              </GameButton>
            )}
            {mergeMode && (
              <>
                <GameButton
                  onClick={handleMergeUsers}
                  disabled={selectedUsers.size < 2}
                >
                  Merge Selected ({selectedUsers.size})
                </GameButton>
                <GameButton onClick={cancelMerge}>Cancel</GameButton>
                <input
                  type="text"
                  placeholder="Merged name (optional)"
                  value={mergeName}
                  onChange={(e) => setMergeName(e.target.value)}
                  className="merge-name-input"
                />
              </>
            )}
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
        {stats.length > 0 && (
          <table className="stats-table">
            <thead>
              <tr>
                {mergeMode && <th></th>}
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
                <tr
                  key={stat.uid}
                  className={selectedUsers.has(stat.uid) ? 'selected' : ''}
                  onClick={() => mergeMode && toggleUserSelection(stat.uid)}
                >
                  {mergeMode && (
                    <td>
                      <Checkbox
                        checked={selectedUsers.has(stat.uid)}
                        onChange={() => toggleUserSelection(stat.uid)}
                      />
                    </td>
                  )}
                    <PlayerNameCell stat={stat} />
                  <CounterRow val={stat.total_games} />
                  <CounterRow val={stat.total_turns_played} />
                  <CounterRow val={stat.total_wins} />
                  <CounterRow val={`${(stat.win_rate * 100).toFixed(1)}%`} />
                  <CounterRow val={stat.total_score} />
                  <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                  <CounterRow val={stat.total_likes_received} />
                  <CounterRow val={stat.total_discards} />
                  <PlayerUidCell stat={stat} />
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
    <td className="player-name">
      <PlayerAvatar player={player} />
      {names.join(', ')}
    </td>
  );
}

function PlayerUidCell({ stat }: { stat: UserStats }) {
  const uids = Array.from(new Set(stat.playerInLobbyRefs.map((p) => p.uid)));
  return <td className="player-uid">{uids.join(', ')}</td>;
}