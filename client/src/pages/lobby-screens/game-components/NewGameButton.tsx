import { useNavigate } from 'react-router-dom';
import { useErrorContext } from '../../../components/ErrorContext';
import { createLobbyAsCopy } from '../../../api/lobby/lobby-join-api';
import { GameButton } from '../../../components/Buttons';
import { GameLobby } from '../../../shared/types';
import { useState } from 'react';

interface Props {
  lobby: GameLobby;
}

/** Starts a new game with the same players */
export function NewGameButton({ lobby }: Props) {
  const navigate = useNavigate();
  const { setError } = useErrorContext();
  const [starting, setStarting] = useState(false);

  async function handleNewGame() {
    try {
      setStarting(true);
      const nextLobbyID = await createLobbyAsCopy(lobby.id);
      navigate(`/${nextLobbyID}`);
    } catch (e: any) {
      setError(e);
    } finally {
      setStarting(false);
    }
  }

  return (
    <GameButton onClick={handleNewGame} loading={starting}>
      New game
    </GameButton>
  );
}
