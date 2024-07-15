import { GamePlayerMenu } from './GamePlayerMenu';
import { PlayerCountBadge } from './PlayerCountBadge';
import { ScoreBadge } from './ScoreBadge';
import { TurnCounter } from './TurnCounter';

/** Header with a toolbar at the top of the game page */
export function GameHeader() {
  return (
    <>
      <div className="menu-row">
        <div className="menu-row-left">
          <PlayerCountBadge />
          <TurnCounter />
        </div>

        <div className="menu-row-right">
          <ScoreBadge />
          <GamePlayerMenu />
        </div>
      </div>
    </>
  );
}
