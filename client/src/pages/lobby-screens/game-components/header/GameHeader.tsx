import { TurnTimer } from '../TurnTimer';
import { DiscardTokensBadge } from './DiscardTokensBadge';
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

        <div className="menu-row-mid">
          {/* TODO: on mobile, make sure this is sticky */}
          <TurnTimer />
        </div>

        <div className="menu-row-right">
          <div className="badges">
            <DiscardTokensBadge />
            <ScoreBadge />
          </div>
          <GamePlayerMenu />
        </div>
      </div>
    </>
  );
}
