export type SeasonTheme = 'normal' | 'halloween' | 'christmas' | 'spring';

export const SEASON: SeasonTheme = 'spring';

export function isSeason(season: SeasonTheme): boolean {
  return season === SEASON;
}
