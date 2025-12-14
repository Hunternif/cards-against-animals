import { StatsContainer, UserStats, YearStats } from '@shared/types';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate } from 'react-router-dom';
import { useHandler1 } from '../hooks/data-hooks';
import { loadAllStats } from '../api/stats-repository';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { firebaseAuth } from '../firebase';
import { RewindStory } from './rewind/RewindStory';

export function RewindPage() {
  const [user, loadingUser] = useAuthState(firebaseAuth);
  const [stats, setStats] = useState<StatsContainer | null>(null);
  const [userStats, setUserStats] = useState<{
    allTime: UserStats;
    year2025: UserStats | null;
    year2024: UserStats | null;
  } | null>(null);

  const [fetchStats, fetchingStats] = useHandler1(async (user: User) => {
    const container = await loadAllStats();
    setStats(container);

    // Get user stats for all time, 2025, and 2024
    const allTimeStats = container.yearMap.get('all_time');
    const stats2025 = container.yearMap.get(2025);
    const stats2024 = container.yearMap.get(2024);

    const findUserStats = (yearStats: YearStats | undefined) =>
      yearStats?.userStats.find((s) => s.uid === user.uid) || null;
    const allTime = findUserStats(allTimeStats);
    const year2025 = findUserStats(stats2025);
    const year2024 = findUserStats(stats2024);
    if (allTime) {
      setUserStats({ allTime, year2024, year2025 });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchStats(user);
  }, [user, fetchStats]);

  if (loadingUser || fetchingStats) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!userStats || !stats) {
    return (
      <div className="rewind-no-data">
        <h1>No data available</h1>
        <p>Play some games to see your rewind!</p>
      </div>
    );
  }

  return (
    <RewindStory user={user} userStats={userStats} statsContainer={stats} />
  );
}
