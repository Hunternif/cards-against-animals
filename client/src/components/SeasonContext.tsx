import { createContext, useContext } from 'react';

export type Season = 'normal' | 'halloween' | 'christmas' | 'spring';

interface ContextState {
  season: Season;
  isSeason(season: Season): boolean;
}

function makeState(season: Season): ContextState {
  return {
    season,
    isSeason: (s) => s === season,
  };
}

export const SeasonContext = createContext<ContextState>(makeState('normal'));

export function useSeasonContext() {
  return useContext(SeasonContext);
}

enum Month {
  JANUARY = 0,
  FEBRUARY = 1,
  MARCH = 2,
  APRIL = 3,
  MAY = 4,
  JUNE = 5,
  JULY = 6,
  AUGUST = 7,
  SEPTEMBER = 8,
  OCTOBER = 9,
  NOVEMBER = 10,
  DECEMBER = 11,
}

function currentSeason(): Season {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();
  if (month == Month.JANUARY && day <= 10) {
    return 'christmas';
  }
  if (month >= Month.MARCH && month <= Month.MAY) {
    return 'spring';
  }
  if (month == Month.OCTOBER || (month == Month.NOVEMBER && day < 10)) {
    return 'halloween';
  }
  if (month == Month.DECEMBER) {
    return 'christmas';
  }
  return 'normal';
}

export function currentSeasonState(): ContextState {
  return makeState(currentSeason());
}
