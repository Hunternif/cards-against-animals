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
  mergeAllYearUserStats,
  parseAllYearStats,
} from '../../api/stats-api';
import { loadAllStats, saveAllStats } from '../../api/stats-repository';
import { GameButton } from '../../components/Buttons';
import { SelectInput, SelectOption } from '../../components/FormControls';
import { IconLink } from '../../components/Icons';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler, useHandler2 } from '../../hooks/data-hooks';
import { AdminGlobalStatsSection } from './admin-components/AdminGlobalStatsSection';
import { AdminSubpage } from './admin-components/AdminSubpage';
import { UserStatsTable } from './admin-components/UserStatsTable';

/**
 * Admin page for managing and viewing game statistics.
 * Loads stats from Firestore, allows fetching full game data to parse new stats,
 * and provides saving functionality back to Firestore.
 */
export function AdminStatsPage() {
  const [stats, setStats] = useState<StatsContainer>(new StatsContainer());
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all_time');
  const [isModified, setIsModified] = useState(false);

  const availableYears = useMemo(
    () => Array.from(stats.yearMap.keys()),
    [stats],
  );
  const selectedStats = useMemo(
    () => stats.yearMap.get(selectedYear),
    [stats, selectedYear],
  );

  const yearOptions: SelectOption<string>[] = useMemo(
    () =>
      availableYears.map(
        (year) =>
          [
            year.toString(),
            year === 'all_time' ? 'All Years' : year.toString(),
          ] as SelectOption<string>,
      ),
    [availableYears],
  );

  const [loadStatsFromFirestore, loadingFromFirestore] =
    useHandler(async () => {
      const data = await loadAllStats();
      setStats(data);
      setIsModified(false);
    }, []);

  // Load stats from Firestore on mount
  useEffect(() => {
    loadStatsFromFirestore();
  }, [loadStatsFromFirestore]);

  const [parseStats] = useHandler2(
    async (lobbies: GameLobby[], userMergeMap: UserMergeMap) => {
      const newStats = await parseAllYearStats(lobbies, userMergeMap);
      setStats(newStats);
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

  const [handleMergeUsers] = useHandler2(
    async (primaryUid: string, uids: string[]) => {
      if (gameData) {
        const newMergeMap = UserMergeMap.from(stats.userMergeMap);
        newMergeMap.mergeUser(primaryUid, uids);
        // Re-parse stats for all years with the updated merge map
        await parseStats(gameData, newMergeMap);
      } else {
        // Attempt to merge stats locally
        const newStats = mergeAllYearUserStats(stats, primaryUid, uids);
        setStats(newStats);
      }
    },
    [gameData, stats],
  );

  const handleExportGameData = () => {
    if (!gameData) return;
    exportGameDataToFile(gameData);
  };

  const [handleSaveToFirestore, saving] = useHandler(async () => {
    const confirmed = window.confirm(
      `This will overwrite all statistics in Firestore. Continue?`,
    );

    if (!confirmed) return;

    try {
      await saveAllStats(stats);
      setIsModified(false);
      alert('Statistics saved successfully!');
    } catch (error) {
      console.error('Error saving stats to Firestore:', error);
      alert('Failed to save statistics. Check console for details.');
    }
  }, [stats]);

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
              disabled={!isModified || fetchingGameData || !selectedStats}
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
            {selectedStats && (
              <span className="stats-summary">
                {selectedStats.globalStats.total_games} games
              </span>
            )}
            {selectedStats && selectedStats.userStats.length > 0 && (
              <span className="stats-summary">
                {selectedStats.userStats.length} users
              </span>
            )}
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
      <div className="user-stats">
        {selectedStats && (
          <>
            <AdminGlobalStatsSection globalStats={selectedStats.globalStats} />
            <UserStatsTable
              stats={selectedStats.userStats}
              userMergeMap={stats.userMergeMap}
              onMergeUsers={handleMergeUsers}
            />
          </>
        )}
      </div>
    </AdminSubpage>
  );
}
