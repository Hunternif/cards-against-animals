import { useState } from 'react';
import { startNewTurn } from '../../../api/turn/turn-control-api';
import { useErrorContext } from '../../../components/ErrorContext';
import { useGameContext } from './GameContext';
import { GameButton } from '../../../components/Buttons';
import { Timer } from '../../../components/Timer';

export function NextTurnButton() {
  const { lobby, turn } = useGameContext();
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const { setError } = useErrorContext();

  const nextTurnTime = lobby.settings.next_turn_time_sec * 1000;
  const shouldAutoContinue = nextTurnTime > 0;

  async function handleNewTurn() {
    try {
      setStartingNewTurn(true);
      await startNewTurn(lobby, turn);
    } catch (e: any) {
      setError(e);
    } finally {
      setStartingNewTurn(false);
    }
  }

  return (
    <GameButton accent onClick={handleNewTurn} disabled={startingNewTurn}>
      {startingNewTurn ? (
        'Next turn...'
      ) : shouldAutoContinue ? (
        <>
          Next turn in{' '}
          <b>
            <Timer onlySeconds totalMs={nextTurnTime} onClear={handleNewTurn} />
          </b>
        </>
      ) : (
        'Next turn'
      )}
    </GameButton>
  );
}
