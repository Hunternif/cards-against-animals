import { useEffect, useState } from 'react';
import { SelectInput, SelectOption } from '../../../components/FormControls';
import {
  filterLobbiesByYear,
  getAvailableYears,
  parseUserStatistics,
} from '../../../api/stats-api';
import {
  GameLobby,
  StatsContainer,
  UserMergeMap,
  YearFilter,
} from '@shared/types';
import { AdminGlobalStatsSection } from './AdminGlobalStatsSection';
import { UserStatsTable } from './UserStatsTable';

interface AdminStatsViewerProps {
  /** All game data, used to derive available years and filter by year */
  gameData: GameLobby[] | null;
  /** Stats container to display */
  initialStats: StatsContainer;
  /** Callback when stats are modified and need to be saved */
  onStatsChange: (container: StatsContainer) => void;
}

/**
 * Inner component that displays and manages user statistics.
 * It can work with stats from any source (Firestore or parsed game data).
 * Allows filtering by year and modifying the user merge map.
 */
export function AdminStatsViewer({
  gameData,
  initialStats,
  onStatsChange,
}: AdminStatsViewerProps) {
  const [stats, setStats] = useState<StatsContainer>(initialStats);
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
  }, [initialStats]);

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
      const newContainer = await parseUserStatistics(
        filteredLobbies,
        stats.userMergeMap,
      );
      setStats(newContainer);
      onStatsChange(newContainer);
    }
  };

  const handleMergeMapChange = async (newMergeMap: UserMergeMap) => {
    // Re-parse stats with the updated merge map
    if (gameData) {
      const filteredLobbies = filterLobbiesByYear(gameData, selectedYear);
      const newContainer = await parseUserStatistics(
        filteredLobbies,
        newMergeMap,
      );
      setStats(newContainer);
      onStatsChange(newContainer);
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
        {stats.globalStats && (
          <span className="stats-summary">
            {stats.globalStats.total_games} games
          </span>
        )}
        {stats.userStats.length > 0 && (
          <span className="stats-summary">{stats.userStats.length} users</span>
        )}
      </div>

      <div className="user-stats">
        {stats.globalStats && (
          <AdminGlobalStatsSection globalStats={stats.globalStats} />
        )}
        <UserStatsTable
          stats={stats.userStats}
          userMergeMap={stats.userMergeMap}
          onMergeMapChange={handleMergeMapChange}
        />
      </div>
    </>
  );
}
