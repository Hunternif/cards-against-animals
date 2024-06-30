import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Scoreboard } from '../../components/Scoreboard';
import { FillLayout } from '../../components/layout/FillLayout';
import { GameLayout } from '../../components/layout/GameLayout';
import { GameLobby, PlayerInLobby } from '../../shared/types';

interface Props {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

export function ScoreboardScreen({ lobby, players }: Props) {
  const navigate = useNavigate();
  return (
    <FillLayout className="scoreboard-screen">
      <GameLayout>
        <header>
          <h2>Scoreboard</h2>
        </header>
        <section>
          <Scoreboard lobby={lobby} players={players} />
        </section>
        <footer></footer>
      </GameLayout>
    </FillLayout>
  );
}
