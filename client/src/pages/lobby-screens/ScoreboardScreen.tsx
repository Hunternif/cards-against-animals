import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useRedirectToNextLobby } from '../../api/lobby/lobby-hooks';
import { soundMusicNge } from '../../api/sound-api';
import { GameButton, InlineButton } from '../../components/Buttons';
import { Scoreboard } from '../../components/Scoreboard';
import { Twemoji } from '../../components/Twemoji';
import { FillLayout } from '../../components/layout/FillLayout';
import { GameLayout } from '../../components/layout/GameLayout';
import { useSound } from '../../hooks/sound-hooks';
import { GameLobby, PlayerInLobby } from '../../shared/types';
import { BestAnswersShowcase } from './game-components/BestAnswersShowcase';
import { useLocalSettings } from './game-components/LocalSettingsContext';
import { NewGameButton } from './game-components/NewGameButton';

interface Props {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

export function ScoreboardScreen({ lobby, user, players }: Props) {
  const navigate = useNavigate();
  const { settings, saveSettings } = useLocalSettings();

  useRedirectToNextLobby(lobby);

  useSound(soundMusicNge, {
    volume: 0.2,
    startTime: lobby.time_created,
    // Don't play if it's been more than 6 hours since the start of lobby:
    startThresholdMs: 1000 * 60 * 60 * 6,
    enabled: settings.enableMusic,
  });

  function toggleMusic() {
    settings.enableMusic = !settings.enableMusic;
    saveSettings(settings);
  }

  return (
    <FillLayout className="scoreboard-screen">
      <BestAnswersShowcase lobby={lobby} />
      <GameLayout>
        <header>
          <h2>Scoreboard</h2>
        </header>
        <section>
          <Scoreboard lobby={lobby} players={players} />
        </section>
        <footer>
          <InlineButton big onClick={toggleMusic}>
            <Twemoji>{settings.enableMusic ? '🔊' : '🔇'}</Twemoji>
          </InlineButton>
          {user.uid === lobby.creator_uid && (
            <>
              <GameButton secondary onClick={() => navigate('/')}>
                Go home
              </GameButton>
              <NewGameButton lobby={lobby} />
            </>
          )}
        </footer>
      </GameLayout>
    </FillLayout>
  );
}
