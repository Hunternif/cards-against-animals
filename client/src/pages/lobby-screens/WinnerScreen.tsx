import confetti from 'canvas-confetti';
import { useRedirectToNextLobby } from '../../api/lobby/lobby-hooks';
import {
  soundApplauseHigh,
  soundApplauseLow,
  soundCheer,
  soundGolfClap,
  soundKidsCheer,
} from '../../api/sound-api';
import { Delay } from '../../components/Delay';
import { IconHeartInline, IconStarInline } from '../../components/Icons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { GameLayout } from '../../components/layout/GameLayout';
import { useSound } from '../../hooks/sound-hooks';
import { useEffectOnce } from '../../hooks/ui-hooks';
import { PlayerInLobby, PlayerResponse } from '../../shared/types';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { EndOfTurnControls } from './game-components/EndOfTurnControls';
import { useGameContext } from './game-components/GameContext';
import { useLocalSettings } from './game-components/LocalSettingsContext';
import { ResponseReading } from './game-components/ResponseReading';
import { Soundboard } from './game-components/Soundboard';

/** Displays winner of the turn */
export function WinnerScreen() {
  const { lobby, turn, players, activePlayers, prompt, responses } =
    useGameContext();
  const winner = players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses.find(
    (r) => r.player_uid === turn.winner_uid,
  );
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid))
    .sort((a, b) => a.random_index - b.random_index);
  const showAudienceAward =
    lobby.settings.enable_likes && audienceAwardResponses.length > 0;

  useEffectOnce(() => {
    confetti({
      ticks: 50,
    });
  });

  const { settings } = useLocalSettings();

  useSound(getApplauseSoundFromLikes(winnerResponse, activePlayers), {
    playUntilEnd: true,
    volume: 0.2,
    enabled: settings.enableAudienceSound,
  });

  useRedirectToNextLobby(lobby);

  return (
    <>
      {/* Add context to share offsets between responses */}
      {/* <CardOffsetContextProvider> */}
      <GameLayout className="winner-screen">
        <div className="sections-container">
          <div className="winner-section">
            <header>
              <h2>
                {winner ? (
                  <>
                    Winner
                    <PlayerAvatar player={winner} />
                    <i>{winner.name}</i> <IconStarInline />
                  </>
                ) : (
                  <Delay>No winner</Delay>
                )}
              </h2>
            </header>
            <section>
              <CardPromptWithCzar card={prompt} showDeckName />
              {winnerResponse && (
                <ResponseReading
                  showLikes
                  player={winner}
                  showName={showAudienceAward}
                  response={winnerResponse}
                />
              )}
            </section>
          </div>
          {showAudienceAward && (
            // TODO: animate audience choice winner transition
            <div className="winner-section audience-award-section">
              <header>
                <h2>
                  Audience Choice <IconHeartInline />
                </h2>
              </header>
              <section>
                {audienceAwardResponses.map((r) => (
                  <ResponseReading
                    showName
                    showLikes
                    key={r.player_uid}
                    response={r}
                    player={players.find((p) => p.uid === r.player_uid)}
                  />
                ))}
              </section>
            </div>
          )}
        </div>
        <footer className="winner-control-row">
          <Delay>
            <EndOfTurnControls />
          </Delay>
          <Soundboard />
        </footer>
      </GameLayout>
      {/* </CardOffsetContextProvider> */}
    </>
  );
}

/** Returns the appropriate applause sound ID based on the number of likes. */
function getApplauseSoundFromLikes(
  response: PlayerResponse | undefined,
  players: PlayerInLobby[],
): string | undefined {
  if (response?.like_count == null) return;
  if (response.like_count >= players.length) return soundKidsCheer;
  if (response.like_count > 3) return soundCheer;
  if (response.like_count > 2) return soundApplauseHigh;
  if (response.like_count > 1) return soundApplauseLow;
  if (response.like_count > 0) return soundGolfClap;
  return soundGolfClap;
}
