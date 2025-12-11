import { UserStats, GlobalStats, YearFilter } from './types';
import { UserMergeMap } from './user-merge-map';

export type YearStats = {
  year: YearFilter;
  userStats: UserStats[];
  globalStats: GlobalStats;
};

export class StatsContainer {
  public yearMap: Map<YearFilter, YearStats>;
  public userMergeMap: UserMergeMap;

  constructor(
    yearMap: Map<YearFilter, YearStats> = new Map(),
    userMergeMap: UserMergeMap = new UserMergeMap(),
  ) {
    this.yearMap = yearMap;
    this.userMergeMap = userMergeMap;
  }
}
