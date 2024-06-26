import confetti from 'canvas-confetti';
import { useContext, useState } from 'react';
import {
  checkIfShouldEndGame,
  endLobby,
  updateLobbySettings,
} from '../../api/lobby/lobby-control-api';
import { startNewTurn } from '../../api/turn/turn-control-api';
import { GameButton } from '../../components/Buttons';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Delay } from '../../components/Delay';
import { ErrorContext } from '../../components/ErrorContext';
import { IconHeartInline, IconStarInline } from '../../components/Icons';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { Timer } from '../../components/Timer';
import { GameLayout } from '../../components/layout/GameLayout';
import { useEffectOnce } from '../../hooks/ui-hooks';
import { CardOffsetContextProvider } from './game-components/CardOffsetContext';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { useGameContext } from './game-components/GameContext';
import { ResponseReading } from './game-components/ResponseReading';
import { Soundboard } from './game-components/Soundboard';

/** Displays winner of the turn */
export function WinnerScreen() {
  const { lobby, turn, players, isJudge, prompt, responses } = useGameContext();
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const [extending, setExtending] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const { setError } = useContext(ErrorContext);
  const winner = players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses.find(
    (r) => r.player_uid === turn.winner_uid,
  );
  const shouldEndNow = checkIfShouldEndGame(lobby, turn, players);
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid))
    .sort((a, b) => a.random_index - b.random_index);
  const showAudienceAward =
    lobby.settings.enable_likes && audienceAwardResponses.length > 0;
  const nextTurnTime = lobby.settings.next_turn_time_sec * 1000;
  const shouldAutoContinue = nextTurnTime > 0;

  async function handleNewTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby, turn).catch((e) => {
      setError(e);
      setStartingNewTurn(false);
    });
  }

  async function handleExtend() {
    setExtending(true);
    lobby.settings.max_turns += Math.min(5, players.length);
    await updateLobbySettings(lobby.id, lobby.settings).catch((e) =>
      setError(e),
    );
    await handleNewTurn();
  }

  async function handleEndGame() {
    setEnding(true);
    await endLobby(lobby).catch((e) => {
      setError(e);
      setEnding(false);
    });
  }

  useEffectOnce(() => {
    confetti();
  });

  return (
    <>
      {/* Add context to share offsets between responses */}
      <CardOffsetContextProvider>
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
            {isJudge && (
              <Delay>
                {extending || shouldEndNow ? (
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
                    <GameButton
                      onClick={() => setShowEndModal(true)}
                      disabled={ending}
                    >
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
                ) : (
                  <GameButton
                    accent
                    onClick={handleNewTurn}
                    disabled={startingNewTurn}
                  >
                    {startingNewTurn ? (
                      'Next turn...'
                    ) : shouldAutoContinue ? (
                      <>
                        Next turn in{' '}
                        <b>
                          <Timer
                            onlySeconds
                            totalMs={nextTurnTime}
                            onClear={handleNewTurn}
                          />
                        </b>
                      </>
                    ) : (
                      'Next turn'
                    )}
                  </GameButton>
                )}
              </Delay>
            )}
            <Soundboard />
          </footer>
        </GameLayout>
      </CardOffsetContextProvider>
    </>
  );
}
