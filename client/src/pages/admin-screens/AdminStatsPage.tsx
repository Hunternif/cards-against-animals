import { useEffect, useState } from 'react';
import {
  exportGameDataToFile,
  fetchAllLobbyData,
  FetchProgressInfo,
  parseUserStatistics,
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
import { IconLink } from '../../components/Icons';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler } from '../../hooks/data-hooks';
import { GameLobby, GlobalStats, UserMergeMap, UserStats, YearFilter } from '@shared/types';
import { AdminStatsViewer } from './admin-components/AdminStatsViewer';
import { AdminSubpage } from './admin-components/AdminSubpage';

/**
 * Outer container component that manages data fetching, parsing, and saving.
 * Loads stats from Firestore, allows fetching full game data to parse new stats,
 * and provides saving functionality back to Firestore.
 */
export function AdminStatsPage() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [gameData, setGameData] = useState<GameLobby[] | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgressInfo | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<YearFilter>('all_time');
  const [userMergeMap, setUserMergeMap] = useState<UserMergeMap>(
    new UserMergeMap(),
  );
  const [isModified, setIsModified] = useState(false);
  const [loadingFromFirestore, setLoadingFromFirestore] = useState(false);

  // Load stats from Firestore on mount
  useEffect(() => {
    const loadStatsFromFirestore = async () => {
      setLoadingFromFirestore(true);
      try {
        const [userStats, globalStatsData, mergeMap] = await Promise.all([
          loadUserStats('all_time'),
          loadGlobalStats('all_time'),
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
  }, []);

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
    const { userStats, globalStats } = await parseUserStatistics(
      gameData,
      userMergeMap,
    );
    setStats(userStats);
    setGlobalStats(globalStats);
    setIsModified(true);
  }, [gameData, userMergeMap]);

  const handleStatsChange = (
    newStats: UserStats[],
    newGlobalStats: GlobalStats | null,
    newMergeMap: UserMergeMap,
  ) => {
    setStats(newStats);
    setGlobalStats(newGlobalStats);
    setUserMergeMap(newMergeMap);
    setIsModified(true);
  };

  const handleExportGameData = () => {
    if (!gameData) return;
    exportGameDataToFile(gameData);
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
      <AdminStatsViewer
        gameData={gameData}
        initialStats={stats}
        initialGlobalStats={globalStats}
        initialUserMergeMap={userMergeMap}
        onStatsChange={handleStatsChange}
      />
    </AdminSubpage>
  );
}
