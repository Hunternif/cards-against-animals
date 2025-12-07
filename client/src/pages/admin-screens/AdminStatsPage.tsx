import { Fragment, useState } from 'react';
import {
  exportGameDataToFile,
  fetchAllLobbyData,
  FetchProgressInfo,
  filterLobbiesByYear,
  getAvailableYears,
  mergeUserStats,
  parseUserStatistics,
  recalculateDerivedStats,
  UserStats,
  YearFilter,
} from '../../api/stats-api';
import { GameButton } from '../../components/Buttons';
import { Checkbox } from '../../components/Checkbox';
import { SelectInput, SelectOption } from '../../components/FormControls';
import {
  IconChevronDownInline,
  IconChevronUpInline,
  IconLink,
} from '../../components/Icons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler } from '../../hooks/data-hooks';
import '../../scss/components/progress-bar.scss';
import { GameLobby } from '../../shared/types';
import { AdminSubpage } from './admin-components/AdminSubpage';

/**
 * Formats milliseconds into a human-readable time string (e.g., "2h 30m")
 */
function formatPlayTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '<1m';
  }
}

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const yearOptions: SelectOption<string>[] = [
    ['all', 'All Years'],
    ...availableYears.map(
      (year) => [year.toString(), year.toString()] as SelectOption<string>,
    ),
  ];

  const [handleFetchData, fetching] = useHandler(async () => {
    setFetchProgress(null);
    const lobbies = await fetchAllLobbyData((progressInfo) => {
      setFetchProgress(progressInfo);
    });
    setGameData(lobbies);
    setFetchProgress(null);

    // Extract available years
    const years = getAvailableYears(lobbies);
    setAvailableYears(years);
    setSelectedYear('all');
  }, []);

  const [handleParseStats, parsing] = useHandler(async () => {
    if (!gameData) return;
    const filteredLobbies = filterLobbiesByYear(gameData, selectedYear);
    const data = await parseUserStatistics(filteredLobbies);
    setStats(data);
  }, [gameData, selectedYear]);

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(uid)) {
      newSelection.delete(uid);
    } else {
      newSelection.add(uid);
    }
    setSelectedUsers(newSelection);
  };

  const handleMergeUsers = async () => {
    if (selectedUsers.size < 2) {
      alert('Please select at least 2 users to merge');
      return;
    }

    const usersToMerge = stats.filter((s) => selectedUsers.has(s.uid));
    const primaryUser = usersToMerge[0];

    const merged = mergeUserStats(
      usersToMerge,
      primaryUser.uid,
      primaryUser.name,
    );

    // Remove merged users and add the combined one
    const newStats = stats.filter((s) => !selectedUsers.has(s.uid));
    newStats.push(merged);

    // Recalculate derived stats for the merged user
    await recalculateDerivedStats(newStats);

    newStats.sort((a, b) => b.total_games - a.total_games);

    setStats(newStats);
    setSelectedUsers(new Set());
    setMergeMode(false);
  };

  const cancelMerge = () => {
    setMergeMode(false);
    setSelectedUsers(new Set());
  };

  const handleExportGameData = () => {
    if (!gameData) return;
    exportGameDataToFile(gameData);
  };

  const handleSelectYear = (newYear: YearFilter) => {
    setSelectedYear(newYear);

    // Auto re-parse if we already have game data
    if (gameData) {
      const filteredLobbies = filterLobbiesByYear(gameData, newYear);
      parseUserStatistics(filteredLobbies).then(setStats);
    }

    // Reset merge mode
    setMergeMode(false);
    setSelectedUsers(new Set());
  };

  return (
    <AdminSubpage
      title="Statistics"
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton small onClick={handleFetchData} loading={fetching}>
              Fetch Game Data
            </GameButton>
            <GameButton
              small
              onClick={handleExportGameData}
              disabled={!gameData}
              iconLeft={<IconLink />}
            >
              Export Data
            </GameButton>

            <GameButton
              small
              onClick={handleParseStats}
              loading={parsing}
              disabled={!gameData}
            >
              Parse Statistics
            </GameButton>

            {availableYears.length > 0 && (
              <SelectInput
                small
                value={selectedYear.toString()}
                options={yearOptions}
                onChange={async (value) => {
                  const newYear = value === 'all' ? 'all' : parseInt(value);
                  handleSelectYear(newYear);
                }}
                className="year-selector"
                disabled={parsing || fetching}
              />
            )}
            {stats.length > 0 && !mergeMode && (
              <GameButton secondary small onClick={() => setMergeMode(true)}>
                Merge Users
              </GameButton>
            )}
            {mergeMode && (
              <>
                <GameButton
                  small
                  onClick={handleMergeUsers}
                  disabled={selectedUsers.size < 2}
                >
                  Merge Selected ({selectedUsers.size})
                </GameButton>
                <GameButton small onClick={cancelMerge}>
                  Cancel
                </GameButton>
              </>
            )}
            {gameData && (
              <span className="stats-summary">
                {gameData.length} games loaded
              </span>
            )}
            {stats.length > 0 && (
              <span className="stats-summary">
                {stats.length} users
                {selectedYear !== 'all' && ` (${selectedYear})`}
              </span>
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
                <th></th>
                <th>Name</th>
                <th>Games</th>
                <th>Turns</th>
                <th>Wins</th>
                <th>Win Rate</th>
                {/* <th>Total Score</th> -- duplicates win count */}
                <th>Avg Score</th>
                <th>Likes</th>
                <th>Discards</th>
                <th>Time Played</th>
                <th>Avg Time</th>
                <th>First Played</th>
                <th>Last Played</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <Fragment key={stat.uid}>
                  <tr
                    className={selectedUsers.has(stat.uid) ? 'selected' : ''}
                    onClick={() => mergeMode && toggleUserSelection(stat.uid)}
                  >
                    <td className="control-cell">
                      <div className="group">
                        <GameButton
                          inline
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedUser(
                              expandedUser === stat.uid ? null : stat.uid,
                            );
                          }}
                        >
                          {expandedUser === stat.uid ? (
                            <IconChevronUpInline />
                          ) : (
                            <IconChevronDownInline />
                          )}
                        </GameButton>
                        {mergeMode && (
                          <Checkbox
                            checked={selectedUsers.has(stat.uid)}
                            onChange={() => toggleUserSelection(stat.uid)}
                          />
                        )}
                      </div>
                    </td>
                    <PlayerNameCell stat={stat} />
                    <CounterRow val={stat.total_games} />
                    <CounterRow val={stat.total_turns_played} />
                    <CounterRow val={stat.total_wins} />
                    <CounterRow val={`${(stat.win_rate * 100).toFixed(1)}%`} />
                    {/* <CounterRow val={stat.total_score} /> */}
                    <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                    <CounterRow val={stat.total_likes_received} />
                    <CounterRow val={stat.total_discards} />
                    <td className="col-counter">
                      {formatPlayTime(stat.total_time_played_ms)}
                    </td>
                    <td className="col-counter">
                      {formatPlayTime(stat.average_time_per_game_ms)}
                    </td>
                    <td className="col-counter">
                      {stat.first_time_played
                        ? new Date(stat.first_time_played).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="col-counter">
                      {stat.last_time_played
                        ? new Date(stat.last_time_played).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                  {expandedUser === stat.uid && (
                    <tr className="detail-row">
                      <td colSpan={mergeMode ? 16 : 15}>
                        <UserStatsDetails stat={stat} />
                      </td>
                    </tr>
                  )}
                </Fragment>
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

function UserStatsDetails({ stat }: { stat: UserStats }) {
  // Get top months
  const topMonths = Array.from(stat.games_per_month.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="user-stats-details">
      <div className="detail-section">
        <h4>UIDs</h4>
        <p>
          {Array.from(new Set(stat.playerInLobbyRefs.map((p) => p.uid))).join(
            ', ',
          )}
        </p>
      </div>

      {topMonths.length > 0 && (
        <div className="detail-section">
          <h4>Most Active Months</h4>
          <ul>
            {topMonths.map(([month, count]) => (
              <li key={month}>
                {month}: {count} games
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_cards_used.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Cards Used</h4>
          <ul>
            {stat.top_cards_used.map((item, idx) => (
              <li key={idx}>
                {item.card} ({item.count}x)
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_liked_responses.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Liked Responses (normalized)</h4>
          <ul>
            {stat.top_liked_responses.map((item, idx) => (
              <li key={idx}>
                {item.response} ({(item.normalized_likes * 100).toFixed(0)}% of{' '}
                {item.lobby_size - 1} players)
              </li>
            ))}
          </ul>
        </div>
      )}

      {stat.top_teammates.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Teammates</h4>
          <ul>
            {stat.top_teammates.map((teammate) => (
              <li key={teammate.uid}>
                {teammate.name} ({teammate.games} games)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
