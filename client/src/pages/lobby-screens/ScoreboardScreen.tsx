import { User } from 'firebase/auth';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameButton } from '../../components/Buttons';
import { Delay } from '../../components/Delay';
import { Scoreboard } from '../../components/Scoreboard';
import { FillLayout } from '../../components/layout/FillLayout';
import { GameLayout } from '../../components/layout/GameLayout';
import { GameLobby, PlayerInLobby } from '../../shared/types';
import { NewGameButton } from './game-components/NewGameButton';

interface Props {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

export function ScoreboardScreen({ lobby, user, players }: Props) {
  const navigate = useNavigate();
  const existingNextLobbyID = useMemo(() => lobby.next_lobby_id, []);

  // When next lobby id first arrives, redirect to the new lobby page:
  useEffect(() => {
    if (existingNextLobbyID == null && lobby.next_lobby_id != null) {
      navigate(`/${lobby.next_lobby_id}`);
    }
  }, [lobby.next_lobby_id]);

  return (
    <FillLayout className="scoreboard-screen">
      <GameLayout>
        <header>
          <h2>Scoreboard</h2>
        </header>
        <section>
          <Scoreboard lobby={lobby} players={players} />
        </section>
        <footer>
          {user.uid === lobby.creator_uid && (
            <Delay>
              <GameButton secondary onClick={() => navigate('/')}>
                Go home
              </GameButton>
              <NewGameButton lobby={lobby} />
            </Delay>
          )}
        </footer>
      </GameLayout>
    </FillLayout>
  );
}
