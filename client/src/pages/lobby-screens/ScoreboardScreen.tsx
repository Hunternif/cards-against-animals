import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { GameButton } from '../../components/Buttons';
import { Delay } from '../../components/Delay';
import { Scoreboard } from '../../components/Scoreboard';
import { FillLayout } from '../../components/layout/FillLayout';
import { GameLayout } from '../../components/layout/GameLayout';
import { GameLobby, PlayerInLobby } from '../../shared/types';
import { NewGameButton } from './game-components/NewGameButton';
import { useRedirectToNextLobby } from '../../api/lobby/lobby-hooks';

interface Props {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

export function ScoreboardScreen({ lobby, user, players }: Props) {
  const navigate = useNavigate();
  useRedirectToNextLobby(lobby);

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
