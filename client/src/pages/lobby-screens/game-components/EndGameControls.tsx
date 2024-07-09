import { useState } from 'react';
import {
  endLobby,
  updateLobbySettings,
} from '../../../api/lobby/lobby-control-api';
import { createLobbyAsCopy } from '../../../api/lobby/lobby-join-api';
import { startNewTurn } from '../../../api/turn/turn-control-api';
import { GameButton } from '../../../components/Buttons';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useErrorContext } from '../../../components/ErrorContext';
import { sleep } from '../../../shared/utils';
import { useGameContext } from './GameContext';

/**
 * Buttons that are shown at the end of the turn,
 * allowing to extend or end the game.
 */
export function EndGameControls() {
  const { lobby, turn, players } = useGameContext();
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const [extending, setExtending] = useState(false);
  const [startingNewGame, setStartingNewGame] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const { setError } = useErrorContext();

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

  async function handleExtend() {
    try {
      setExtending(true);
      lobby.settings.max_turns += Math.min(5, players.length);
      await updateLobbySettings(lobby.id, lobby.settings);
      await handleNewTurn();
    } catch (e: any) {
      setError(e);
    } finally {
      setExtending(false);
    }
  }

  async function handleEndGame() {
    try {
      setEnding(true);
      await endLobby(lobby);
    } catch (e: any) {
      setError(e);
    } finally {
      setEnding(false);
    }
  }

  async function handleNewGame() {
    try {
      setStartingNewGame(true);
      await endLobby(lobby);
      await sleep(2000);
      await createLobbyAsCopy(lobby.id);
    } catch (e: any) {
      setError(e);
    } finally {
      setStartingNewGame(false);
    }
  }

  return (
    <>
      <ConfirmModal
        show={showEndModal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={handleEndGame}
        loading={ending}
        loadingText="Ending game..."
      >
        End the game for everyone?
      </ConfirmModal>
      <GameButton secondary onClick={handleNewGame} loading={startingNewGame}>
        New game
      </GameButton>
      <GameButton onClick={() => setShowEndModal(true)} disabled={ending}>
        End game
      </GameButton>
      <GameButton
        secondary
        onClick={handleExtend}
        disabled={extending || ending}
      >
        Play more!
      </GameButton>
    </>
  );
}
