import { StatsContainer, UserStats } from '@shared/types';
import { User } from 'firebase/auth';

export interface SlideProps {
  user: User;
  userStats: {
    allTime: UserStats;
    year2025: UserStats | null;
    year2024: UserStats | null;
  };
  statsContainer: StatsContainer;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}
