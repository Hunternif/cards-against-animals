import { GameLobby, StatsContainer, YearFilter } from '@shared/types';
import { useEffect, useState } from 'react';
import {
  exportGameDataToFile,
  fetchAllLobbyData,
  FetchProgressInfo,
  parseUserStatistics,
} from '../../api/stats-api';
import {
  loadAllStats,
  saveAllStats
} from '../../api/stats-repository';
import { GameButton } from '../../components/Buttons';
import { IconLink } from '../../components/Icons';
import { ProgressBar } from '../../components/ProgressBar';
import { useHandler } from '../../hooks/data-hooks';
import { AdminStatsViewer } from './admin-components/AdminStatsViewer';
import { AdminSubpage } from './admin-components/AdminSubpage';

/**
 * Outer container component that manages data fetching, parsing, and saving.
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

  // Load stats from Firestore on mount
  const [loadStatsFromFirestore, loadingFromFirestore] =
    useHandler(async () => {
      const loadedStats = await loadAllStats('all_time');
      setStats(loadedStats);
      setIsModified(false);
    }, []);
  useEffect(() => {
    loadStatsFromFirestore();
  }, [loadStatsFromFirestore]);

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
    const newContainer = await parseUserStatistics(
      gameData,
      stats.userMergeMap,
    );
    setStats(newContainer);
    setIsModified(true);
  }, [gameData, stats.userMergeMap]);

  const handleStatsChange = (newContainer: StatsContainer) => {
    setStats(newContainer);
    setIsModified(true);
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
              disabled={!isModified || fetching || !stats.hasStats}
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
        onStatsChange={handleStatsChange}
      />
    </AdminSubpage>
  );
}
