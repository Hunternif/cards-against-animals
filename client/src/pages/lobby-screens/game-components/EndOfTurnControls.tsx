import { checkIfShouldEndGame } from '../../../api/lobby/lobby-control-api';
import { useAsyncData } from '../../../hooks/data-hooks';
import { assertExhaustive } from '../../../shared/utils';
import { EndGameControls } from './EndGameControls';
import { useGameContext } from './GameContext';
import { NextTurnButton } from './NextTurnButton';

/**
 * Buttons displayed at the end of turn, to continue to next turn.
 * Potentially offers to end or extend the game.
 */
export function EndOfTurnControls() {
  const {
    lobby,
    turn,
    players,
    isJudge,
    isCreator,
    canControlLobby,
  } = useGameContext();
  const lobbyControl = lobby.settings.lobby_control;

  let showEndgameControls = false;
  switch (lobbyControl) {
    case 'anyone':
    case 'players':
      showEndgameControls = isJudge || isCreator;
      break;
    case 'creator':
    case 'creator_or_czar':
      showEndgameControls = canControlLobby;
      break;
    default:
      assertExhaustive(lobbyControl);
  }

  // Use memo so that this is not recalculated when settings update:
  const [shouldEndNow, loading] = useAsyncData(
    checkIfShouldEndGame(lobby, turn, players),
  );

  // Prevent flashing the button.
  if (loading) return null;

  if (shouldEndNow) {
    return <>{showEndgameControls && <EndGameControls />}</>;
  } else {
    return <>{isJudge && <NextTurnButton />}</>;
  }
}
