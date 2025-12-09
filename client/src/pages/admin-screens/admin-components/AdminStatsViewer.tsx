import { useEffect, useState } from 'react';
import { SelectInput, SelectOption } from '../../../components/FormControls';
import {
  filterLobbiesByYear,
  getAvailableYears,
  parseUserStatistics,
} from '../../../api/stats-api';
import {
  GameLobby,
  GlobalStats,
  UserMergeMap,
  UserStats,
  YearFilter,
} from '@shared/types';
import { AdminGlobalStatsSection } from './AdminGlobalStatsSection';
import { UserStatsTable } from './UserStatsTable';

interface AdminStatsViewerProps {
  /** All game data, used to derive available years and filter by year */
  gameData: GameLobby[] | null;
  /** Initial stats to display */
  initialStats: UserStats[];
  /** Initial global stats to display */
  initialGlobalStats: GlobalStats | null;
  /** Initial user merge map */
  initialUserMergeMap: UserMergeMap;
  /** Callback when stats are modified and need to be saved */
  onStatsChange: (
    stats: UserStats[],
    globalStats: GlobalStats | null,
    mergeMap: UserMergeMap,
  ) => void;
}

/**
 * Inner component that displays and manages user statistics.
 * It can work with stats from any source (Firestore or parsed game data).
 * Allows filtering by year and modifying the user merge map.
 */
export function AdminStatsViewer({
  gameData,
  initialStats,
  initialGlobalStats,
  initialUserMergeMap,
  onStatsChange,
}: AdminStatsViewerProps) {
  const [stats, setStats] = useState<UserStats[]>(initialStats);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(
    initialGlobalStats,
  );
  const [userMergeMap, setUserMergeMap] =
    useState<UserMergeMap>(initialUserMergeMap);
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all_time');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const yearOptions: SelectOption<string>[] = [
    ['all_time', 'All Years'],
    ...availableYears.map(
      (year) => [year.toString(), year.toString()] as SelectOption<string>,
    ),
  ];

  // Update internal state when props change
  useEffect(() => {
    setStats(initialStats);
    setGlobalStats(initialGlobalStats);
    setUserMergeMap(initialUserMergeMap);
  }, [initialStats, initialGlobalStats, initialUserMergeMap]);

  // Extract available years from game data
  useEffect(() => {
    if (gameData) {
      const years = getAvailableYears(gameData);
      setAvailableYears(years);
    }
  }, [gameData]);

  const handleSelectYear = async (newYear: YearFilter) => {
    setSelectedYear(newYear);

    if (gameData) {
      const filteredLobbies = filterLobbiesByYear(gameData, newYear);
      const { userStats, globalStats } = await parseUserStatistics(
        filteredLobbies,
        userMergeMap,
      );
      setStats(userStats);
      setGlobalStats(globalStats);
      onStatsChange(userStats, globalStats, userMergeMap);
    }
  };

  const handleMergeMapChange = async (newMergeMap: UserMergeMap) => {
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
      onStatsChange(userStats, globalStats, newMergeMap);
    }
  };

  return (
    <>
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
          />
        )}
        {globalStats && (
          <span className="stats-summary">{globalStats.total_games} games</span>
        )}
        {stats.length > 0 && (
          <span className="stats-summary">{stats.length} users</span>
        )}
      </div>

      <div className="user-stats">
        {globalStats && <AdminGlobalStatsSection globalStats={globalStats} />}
        <UserStatsTable
          stats={stats}
          userMergeMap={userMergeMap}
          onMergeMapChange={handleMergeMapChange}
        />
      </div>
    </>
  );
}
