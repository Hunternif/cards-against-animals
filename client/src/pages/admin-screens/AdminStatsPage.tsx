import { Fragment, useEffect, useState } from 'react';
import {
  exportGameDataToFile,
  fetchAllLobbyData,
  FetchProgressInfo,
  filterLobbiesByYear,
  getAvailableYears,
  GlobalStats,
  mergeUserStats,
  parseUserStatistics,
  UserMergeMap,
  UserStats,
} from '../../api/stats-api';
import {
  loadGlobalStats,
  loadUserMergeMap,
  loadUserStats,
  saveGlobalStats,
  saveUserMergeMap,
  saveUserStats,
} from '../../api/stats-repository';
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
import { GameLobby, YearFilter } from '@shared/types';
import { AdminGlobalStatsSection } from './admin-components/AdminGlobalStatsSection';
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

function formatDate(date: Date | undefined) {
  if (!date) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all_time');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [userMergeMap, setUserMergeMap] = useState<UserMergeMap>(new Map());
  const [isModified, setIsModified] = useState(false);
  const [loadingFromFirestore, setLoadingFromFirestore] = useState(false);
  const yearOptions: SelectOption<string>[] = [
    ['all_time', 'All Years'],
    ...availableYears.map(
      (year) => [year.toString(), year.toString()] as SelectOption<string>,
    ),
  ];

  // Load stats from Firestore on mount
  useEffect(() => {
    const loadStatsFromFirestore = async () => {
      setLoadingFromFirestore(true);
      try {
        const [userStats, globalStatsData, mergeMap] = await Promise.all([
          loadUserStats(selectedYear),
          loadGlobalStats(selectedYear),
          loadUserMergeMap(),
        ]);

        if (userStats.length > 0) {
          setStats(userStats);
          setGlobalStats(globalStatsData);
          setUserMergeMap(mergeMap);
          setIsModified(false);
        }
      } catch (error) {
        console.error('Error loading stats from Firestore:', error);
      } finally {
        setLoadingFromFirestore(false);
      }
    };

    loadStatsFromFirestore();
  }, []); // Only run on mount

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
    setSelectedYear('all_time');
  }, []);

  const [handleParseStats, parsing] = useHandler(async () => {
    if (!gameData) return;
    const filteredLobbies = filterLobbiesByYear(gameData, selectedYear);
    const { userStats, globalStats } = await parseUserStatistics(
      filteredLobbies,
      userMergeMap,
    );
    setStats(userStats);
    setGlobalStats(globalStats);
    setIsModified(true); // Mark as modified when manually parsing
  }, [gameData, selectedYear, userMergeMap]);

  // Auto-parse stats when game data is loaded:
  useEffect(() => {
    if (gameData) {
      handleParseStats();
    }
  }, [gameData, handleParseStats]);

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

    const { merged, mergedUids } = mergeUserStats(
      usersToMerge,
      primaryUser.uid,
      primaryUser.name,
    );

    // Update the merge map with the new merge
    const newMergeMap = new Map(userMergeMap);
    // Add or update the merge entry
    newMergeMap.set(primaryUser.uid, mergedUids);
    setUserMergeMap(newMergeMap);

    // Re-parse stats with the updated merge map
    if (gameData) {
      const filteredLobbies = filterLobbiesByYear(gameData, selectedYear);
      const { userStats, globalStats } = await parseUserStatistics(
        filteredLobbies,
        newMergeMap,
      );
      setStats(userStats);
      setGlobalStats(globalStats);
      setIsModified(true); // Mark as modified when merging
    }

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

  const handleSelectYear = async (newYear: YearFilter) => {
    setSelectedYear(newYear);

    // Auto re-parse if we already have game data
    if (gameData) {
      const filteredLobbies = filterLobbiesByYear(gameData, newYear);
      const { userStats, globalStats } = await parseUserStatistics(
        filteredLobbies,
        userMergeMap,
      );
      setStats(userStats);
      setGlobalStats(globalStats);
      setIsModified(true); // Mark as modified when changing year
    }

    // Reset merge mode
    setMergeMode(false);
    setSelectedUsers(new Set());
  };

  const [handleSaveToFirestore, saving] = useHandler(async () => {
    if (!stats.length || !globalStats) {
      alert('No stats to save');
      return;
    }

    const confirmed = window.confirm(
      `This will overwrite all statistics in Firestore for ${
        selectedYear === 'all_time' ? 'all years' : selectedYear
      }. Continue?`,
    );

    if (!confirmed) return;

    try {
      await Promise.all([
        saveUserStats(stats, selectedYear),
        saveGlobalStats(globalStats, selectedYear),
        saveUserMergeMap(userMergeMap),
      ]);

      setIsModified(false);
      alert('Statistics saved successfully!');
    } catch (error) {
      console.error('Error saving stats to Firestore:', error);
      alert('Failed to save statistics. Check console for details.');
    }
  }, [stats, globalStats, selectedYear, userMergeMap]);

  return (
    <AdminSubpage
      title={`Statistics ${isModified ? '*' : ''}`}
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton small onClick={handleFetchData} loading={fetching}>
              Fetch Game Data
            </GameButton>
            <GameButton
              small
              onClick={handleParseStats}
              loading={parsing}
              disabled={!gameData || fetching}
            >
              Parse Statistics
            </GameButton>

            <GameButton
              small
              onClick={handleSaveToFirestore}
              loading={saving}
              disabled={!isModified || fetching || stats.length === 0}
            >
              {isModified ? 'Save to Firestore *' : 'Saved'}
            </GameButton>
            <GameButton
              small
              onClick={handleExportGameData}
              disabled={!gameData || fetching}
              iconLeft={<IconLink />}
            >
              Export Data
            </GameButton>
          </div>
          <div className="stats-summaries">
            {availableYears.length > 0 && (
              <SelectInput
                small
                value={selectedYear.toString()}
                options={yearOptions}
                onChange={async (value) => {
                  const newYear =
                    value === 'all_time' ? 'all_time' : parseInt(value);
                  handleSelectYear(newYear);
                }}
                className="year-selector"
                disabled={parsing || fetching}
              />
            )}
            {gameData && (
              <span className="stats-summary">{gameData.length} games</span>
            )}
            {stats.length > 0 && (
              <span className="stats-summary">{stats.length} users</span>
            )}
            {loadingFromFirestore && (
              <span className="stats-summary">Loading from Firestore...</span>
            )}
            {!mergeMode && (
              <GameButton
                secondary
                small
                inline
                onClick={() => setMergeMode(true)}
              >
                Merge Users
              </GameButton>
            )}
            {mergeMode && (
              <>
                <GameButton
                  small
                  inline
                  onClick={handleMergeUsers}
                  disabled={selectedUsers.size < 2}
                >
                  Merge Selected ({selectedUsers.size})
                </GameButton>
                <GameButton small inline onClick={cancelMerge}>
                  Cancel
                </GameButton>
              </>
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
        {globalStats && <AdminGlobalStatsSection globalStats={globalStats} />}

        {stats.length > 0 && (
          <table className="stats-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>First Played</th>
                <th>Last Played</th>
                <th>Games</th>
                <th>Turns</th>
                <th>Wins</th>
                <th>Win Rate</th>
                {/* <th>Total Score</th> -- duplicates win count */}
                <th>Avg Score</th>
                <th>Med Score</th>
                <th>Likes</th>
                <th>Discards</th>
                <th>Time Played</th>
                <th>Avg Time</th>
                <th>Med Time</th>
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
                    <td className="col-date">
                      {stat.first_time_played
                        ? formatDate(new Date(stat.first_time_played))
                        : '-'}
                    </td>
                    <td className="col-date">
                      {stat.last_time_played
                        ? formatDate(new Date(stat.last_time_played))
                        : '-'}
                    </td>
                    <CounterRow val={stat.total_games} />
                    <CounterRow val={stat.total_turns_played} />
                    <CounterRow val={stat.total_wins} />
                    <CounterRow val={`${(stat.win_rate * 100).toFixed(1)}%`} />
                    {/* <CounterRow val={stat.total_score} /> */}
                    <CounterRow val={stat.average_score_per_game.toFixed(1)} />
                    <CounterRow val={stat.median_score_per_game.toFixed(1)} />
                    <CounterRow val={stat.total_likes_received} />
                    <CounterRow val={stat.total_discards} />
                    <CounterRow
                      val={formatPlayTime(stat.total_time_played_ms)}
                    />
                    <CounterRow
                      val={formatPlayTime(stat.average_time_per_game_ms)}
                    />
                    <CounterRow
                      val={formatPlayTime(stat.median_time_per_game_ms)}
                    />
                  </tr>
                  {expandedUser === stat.uid && (
                    <tr className="detail-row">
                      <td></td>
                      <td colSpan={9}>
                        <UserStatsDetails stat={stat} />
                      </td>
                      <td colSpan={6}></td>
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
  const player = stat.player_in_lobby_refs.at(-1);
  const names = Array.from(
    new Set(stat.player_in_lobby_refs.map((p) => p.name)),
  );
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
          {Array.from(
            new Set(stat.player_in_lobby_refs.map((p) => p.uid)),
          ).join(', ')}
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

      {stat.top_cards_played.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Cards Used</h4>
          <ul>
            {stat.top_cards_played.map((item, idx) => (
              <li key={idx}>
                {item.card.content} ({item.count}x)
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
                {item.cards.map((c) => c.content).join(' / ')} (
                {(item.normalized_likes * 100).toFixed(0)}% of{' '}
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

      {stat.top_prompts_played.length > 0 && (
        <div className="detail-section">
          <h4>Top 5 Prompts Chosen (as Czar)</h4>
          <ul>
            {stat.top_prompts_played.map((item, idx) => (
              <li key={idx}>
                {item.prompt.content} ({item.count}x)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
