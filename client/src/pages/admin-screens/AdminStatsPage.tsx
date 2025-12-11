import {
  GameLobby,
  StatsContainer,
  UserMergeMap,
  YearFilter,
} from '@shared/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  exportGameDataToFile,
  fetchAllLobbyData,
  FetchProgressInfo,
  parseAllYearStats,
} from '../../api/stats-api';
import {
  loadStatsFromAllYears,
  saveAllStats,
} from '../../api/stats-repository';
import { GameButton } from '../../components/Buttons';
import { SelectInput, SelectOption } from '../../components/FormControls';
import { IconLink } from '../../components/Icons';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler } from '../../hooks/data-hooks';
import { AdminGlobalStatsSection } from './admin-components/AdminGlobalStatsSection';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { UserStatsTable } from './admin-components/UserStatsTable';

/**
 * Admin page for managing and viewing game statistics.
 * Loads stats from Firestore, allows fetching full game data to parse new stats,
 * and provides saving functionality back to Firestore.
 */
export function AdminStatsPage() {
  const [statsMap, setStatsMap] = useState<Map<YearFilter, StatsContainer>>(
    new Map(),
  );
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all_time');
  const [isModified, setIsModified] = useState(false);

  const availableYears = useMemo(() => Array.from(statsMap.keys()), [statsMap]);
  const stats = useMemo(
    () => statsMap.get(selectedYear) ?? new StatsContainer(),
    [statsMap, selectedYear],
  );

  const yearOptions: SelectOption<string>[] = availableYears.map(
    (year) =>
      [
        year.toString(),
        year === 'all_time' ? 'All Years' : year.toString(),
      ] as SelectOption<string>,
  );

  const [loadStatsFromFirestore, loadingFromFirestore] =
    useHandler(async () => {
      const data = await loadStatsFromAllYears();
      setStatsMap(data);
      setIsModified(false);
    }, []);

  // Load stats from Firestore on mount
  useEffect(() => {
    loadStatsFromFirestore();
  }, [loadStatsFromFirestore]);

  const parseStats = useCallback(
    async (lobbies: GameLobby[], mergeMap: UserMergeMap) => {
      const newStatsMap = await parseAllYearStats(lobbies, mergeMap);
      setStatsMap(newStatsMap);
      setIsModified(true);
    },
    [],
  );

  const [handleFetchGameData, fetchingGameData] = useHandler(async () => {
    setFetchProgress(null);
    const lobbies = await fetchAllLobbyData((progressInfo) => {
      setFetchProgress(progressInfo);
    });
    setGameData(lobbies);
    setFetchProgress(null);
    await parseStats(lobbies, stats.userMergeMap);
  }, [stats.userMergeMap, parseStats]);

  const handleMergeMapChange = async (newMergeMap: UserMergeMap) => {
    // Re-parse stats for all years with the updated merge map
    if (gameData) {
      await parseStats(gameData, newMergeMap);
    }
  };

  const handleExportGameData = () => {
    if (!gameData) return;
    exportGameDataToFile(gameData);
  };

  const [handleSaveToFirestore, saving] = useHandler(async () => {
    if (!stats.hasStats) {
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
      await saveAllStats(stats, selectedYear);
      setIsModified(false);
      alert('Statistics saved successfully!');
    } catch (error) {
      console.error('Error saving stats to Firestore:', error);
      alert('Failed to save statistics. Check console for details.');
    }
  }, [stats, selectedYear]);

  return (
    <AdminSubpage
      title={`Statistics ${isModified ? '*' : ''}`}
      headerContent={
        <>
          <div className="stats-controls">
            <GameButton
              small
              onClick={handleFetchGameData}
              loading={fetchingGameData}
            >
              Fetch Game Data
            </GameButton>
            <GameButton
              small
              onClick={handleSaveToFirestore}
              loading={saving}
              disabled={!isModified || fetchingGameData || !stats.hasStats}
            >
              {isModified ? 'Save to Firestore *' : 'Saved'}
            </GameButton>
            <GameButton
              small
              onClick={handleExportGameData}
              disabled={!gameData || fetchingGameData}
              iconLeft={<IconLink />}
            >
              Export Data
            </GameButton>
          </div>
          {loadingFromFirestore && (
            <div className="stats-summaries">
              <span className="stats-summary">Loading from Firestore...</span>
            </div>
          )}
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
      <div className="stats-summaries">
        {availableYears.length > 0 && (
          <SelectInput
            small
            value={selectedYear.toString()}
            options={yearOptions}
            onChange={(value) => {
              const newYear =
                value === 'all_time' ? 'all_time' : parseInt(value);
              setSelectedYear(newYear);
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
    </AdminSubpage>
  );
}
