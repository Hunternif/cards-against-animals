import confetti from 'canvas-confetti';
import { useCallback } from 'react';
import { useRedirectToNextLobby } from '../../api/lobby/lobby-hooks';
import {
  soundApplauseHigh,
  soundApplauseLow,
  soundCheer,
  soundGolfClap,
  soundKidsCheer,
} from '../../api/sound-api';
import { Delay } from '../../components/Delay';
import {
  IconHeartInline,
  IconRobotInline,
  IconStarInline,
} from '../../components/Icons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { GameLayout } from '../../components/layout/GameLayout';
import { useSound } from '../../hooks/sound-hooks';
import { useEffectOnce } from '../../hooks/ui-hooks';
import { PlayerInLobby, PlayerResponse } from '@shared/types';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { EndOfTurnControls } from './game-components/EndOfTurnControls';
import { useGameContext } from './game-components/GameContext';
import { useLocalSettings } from './game-components/LocalSettingsContext';
import { ResponseReading } from './game-components/ResponseReading';
import { Soundboard } from './game-components/Soundboard';
import { Twemoji } from '../../components/Twemoji';
import { useSeasonContext } from '../../components/SeasonContext';

/** Displays winner of the turn */
export function WinnerScreen() {
  const { isSeason } = useSeasonContext();
  const { lobby, turn, players, activePlayers, prompt, responses } =
    useGameContext();
  const winner = players.find((p) => p.uid === turn.winner_uid);
  const playerMap = new Map(players.map((p) => [p.uid, p]));

  const winnerResponse = responses.find(
    (r) => r.player_uid === turn.winner_uid,
  );
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid))
    .sort((a, b) => a.random_index - b.random_index);
  const showAudienceAward =
    lobby.settings.enable_likes && audienceAwardResponses.length > 0;

  const isBot = useCallback(
    (uid: string) => playerMap.get(uid)?.is_bot,
    [playerMap],
  );

  const botResponses = responses.filter((r) => isBot(r.player_uid));
  const shouldShowBot =
    !isBot(winnerResponse?.player_uid ?? '') &&
    !audienceAwardResponses.find((r) => isBot(r.player_uid));

  useEffectOnce(() => {
    if (!isConfettiInitialized) {
      if (isSeason('halloween')) {
        initializeConfetti(['👻', '🦇', '🎃']);
      } else if (isSeason('christmas')) {
        initializeConfetti(['❄', '❄', '⛄', '🎊']);
      } else {
        isConfettiInitialized = true;
      }
    }
    if (confettiShapes) {
      confetti({
        shapes: confettiShapes,
        flat: true, // this exists, but @types are outdated
        scalar: confettiSize,
        spread: 90,
        particleCount: 15,
        startVelocity: 25,
        decay: 0.92,
        ticks: 50,
      } as confetti.Options);
    } else {
      confetti({
        ticks: 50,
      });
    }
  });

  const { settings } = useLocalSettings();

  useSound(getApplauseSoundFromLikes(winnerResponse, activePlayers), {
    playUntilEnd: true,
    volume: 0.3,
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
                  Audience Choice{' '}
                  {isSeason('christmas') ? (
                    <Twemoji className="like-icon">💝</Twemoji>
                  ) : (
                    <IconHeartInline />
                  )}
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
          {shouldShowBot && (
            <div className="winner-section bot-award-section">
              <header>
                <h2 style={{ alignContent: 'end', opacity: 0.5 }}>
                  <IconRobotInline />
                </h2>
              </header>
              <section>
                {botResponses.map((r) => (
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

const confettiSize = 3;
let isConfettiInitialized = false;
let confettiShapes: confetti.Shape[];

function initializeConfetti(variants: string[]) {
  // This fixes error on browsers that don't support OffscreenCanvas:
  if (typeof OffscreenCanvas !== 'undefined') {
    confettiShapes = variants.map((text) =>
      confetti.shapeFromText({ text, scalar: confettiSize }),
    );
  }
  isConfettiInitialized = true;
}
