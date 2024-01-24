import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { CardOffsetContextProvider } from "../../components/CardOffsetContext";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { Delay } from "../../components/Delay";
import { ErrorContext } from "../../components/ErrorContext";
import { useGameContext } from "../../components/GameContext";
import { IconHeartInline, IconStarInline } from "../../components/Icons";
import { ResponseReading } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { checkIfShouldEndGame, endLobby } from "../../model/lobby-api";
import { startNewTurn } from "../../model/turn-api";

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  // alignItems: "center",
  gap: "3rem",
}

const botRowStyle: CSSProperties = {
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1rem",
}

/** Displays winner of the turn */
export function WinnerScreen() {
  const { lobby, turn, players, isJudge, prompt, responses } = useGameContext();
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const winner = players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses.find((r) => r.player_uid === turn.winner_uid);
  const shouldEndNow = checkIfShouldEndGame(lobby, turn, players);
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid));
  const showAudienceAward = lobby.settings.enable_likes && audienceAwardResponses.length > 0;

  async function handleNewTurn() {
    setStartingNewTurn(true);
    await startNewTurn(lobby).catch((e) => {
      setError(e);
      setStartingNewTurn(false);
    });
  }

  async function handleEndGame() {
    setEnding(true);
    await endLobby(lobby).catch((e) => {
      setError(e);
      setEnding(false);
    });
  }

  return (
    // Add context to share offsets between responses
    <CardOffsetContextProvider>
      <CenteredLayout>
        <div style={midRowStyle}>
          <div className="winner-section">
            <h2 style={{ textAlign: "center" }}>
              {winner ? <>Winner <i>{winner.name}</i> <IconStarInline /></> :
                <Delay>No winner</Delay>}
            </h2>
            <div className="winner-cards-row">
              <CardPromptWithCzar card={prompt} />
              {winnerResponse && (
                <ResponseReading
                  showName={showAudienceAward}
                  response={winnerResponse} />
              )}
            </div>
          </div>
          {showAudienceAward && (
            // TODO: animate audience choice winner transition
            <div className="winner-section audience-award-section">
              <h2 style={{ textAlign: "center" }}>
                Audience Choice <IconHeartInline />
              </h2>
              <div className="winner-cards-row">
                {audienceAwardResponses.map((r, i) => (
                  <ResponseReading key={i} showName showLikes response={r} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={botRowStyle} className="winner-control-row">
          {isJudge && (
            <Delay>
              {shouldEndNow ? (
                <GameButton onClick={handleEndGame} disabled={ending}>
                  End game
                </GameButton>
              ) : (
                <GameButton accent onClick={handleNewTurn}
                  disabled={startingNewTurn}>
                  Next turn
                </GameButton>
              )}
            </Delay>
          )}
        </div>
      </CenteredLayout >
    </CardOffsetContextProvider>
  );
}