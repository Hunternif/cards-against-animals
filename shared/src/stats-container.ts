import { UserStats, GlobalStats } from './types';
import { UserMergeMap } from './user-merge-map';

/**
 * Container class that holds all statistics data together.
 * This simplifies passing around stats data and ensures consistency.
 */
export class StatsContainer {
  constructor(
    public userStats: UserStats[] = [],
    public globalStats: GlobalStats | null = null,
    public userMergeMap: UserMergeMap = new UserMergeMap(),
  ) {}

  /**
   * Returns true if this container has valid stats data.
   */
  get hasStats(): boolean {
    return this.userStats.length > 0 && this.globalStats !== null;
  }

  /**
   * Creates a copy of this container with updated values.
   */
  clone(): StatsContainer {
    return new StatsContainer(
      [...this.userStats],
      this.globalStats ? { ...this.globalStats } : null,
      new UserMergeMap(this.userMergeMap.entries()),
    );
  }

  /**
   * Updates all stats in this container.
   */
  update(
    userStats: UserStats[],
    globalStats: GlobalStats | null,
    userMergeMap: UserMergeMap,
  ): void {
    this.userStats = userStats;
    this.globalStats = globalStats;
    this.userMergeMap = userMergeMap;
  }

  /**
   * Creates a new container with the updated values.
   */
  with(
    userStats?: UserStats[],
    globalStats?: GlobalStats | null,
    userMergeMap?: UserMergeMap,
  ): StatsContainer {
    return new StatsContainer(
      userStats ?? this.userStats,
      globalStats !== undefined ? globalStats : this.globalStats,
      userMergeMap ?? this.userMergeMap,
    );
  }
}
