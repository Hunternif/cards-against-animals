import confetti from 'canvas-confetti';
import { checkIfShouldEndGame } from '../../api/lobby/lobby-control-api';
import { useRedirectToNextLobby } from '../../api/lobby/lobby-hooks';
import { Delay } from '../../components/Delay';
import { IconHeartInline, IconStarInline } from '../../components/Icons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { GameLayout } from '../../components/layout/GameLayout';
import { useAsyncData } from '../../hooks/data-hooks';
import { useEffectOnce } from '../../hooks/ui-hooks';
import { assertExhaustive } from '../../shared/utils';
import { CardOffsetContextProvider } from './game-components/CardOffsetContext';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { EndGameControls } from './game-components/EndGameControls';
import { useGameContext } from './game-components/GameContext';
import { NextTurnButton } from './game-components/NextTurnButton';
import { ResponseReading } from './game-components/ResponseReading';
import { Soundboard } from './game-components/Soundboard';

/** Displays winner of the turn */
export function WinnerScreen() {
  const {
    lobby,
    turn,
    players,
    isJudge,
    isCreator,
    canControlLobby,
    prompt,
    responses,
  } = useGameContext();
  const winner = players.find((p) => p.uid === turn.winner_uid);
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

  const winnerResponse = responses.find(
    (r) => r.player_uid === turn.winner_uid,
  );
  // Use memo so that this is not recalculated when settings update:
  const [shouldEndNow] = useAsyncData(
    checkIfShouldEndGame(lobby, turn, players),
  );
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid))
    .sort((a, b) => a.random_index - b.random_index);
  const showAudienceAward =
    lobby.settings.enable_likes && audienceAwardResponses.length > 0;

  useEffectOnce(() => {
    confetti();
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
                <CardPromptWithCzar card={prompt} />
                {winnerResponse && (
                  <ResponseReading
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
              {shouldEndNow
                ? showEndgameControls && <EndGameControls />
                : isJudge && <NextTurnButton />}
            </Delay>
            <Soundboard />
          </footer>
        </GameLayout>
      {/* </CardOffsetContextProvider> */}
    </>
  );
}
