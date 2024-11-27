export type SeasonTheme = 'normal' | 'halloween' | 'christmas';

export const SEASON: SeasonTheme = 'halloween';

export function isSeason(season: SeasonTheme): boolean {
  return season === SEASON;
}
