import { User } from "@firebase/auth";
import { CSSProperties, useContext, useState } from "react";
import { GameButton } from "../../components/Buttons";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { Delay } from "../../components/Delay";
import { ErrorContext } from "../../components/ErrorContext";
import { ResponseReading, ResponseReadingWithName } from "../../components/ResponseReading";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { startNewTurn } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
import { checkIfShouldEndGame, endLobby } from "../../model/lobby-api";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  judge?: PlayerInLobby,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  // alignItems: "center",
  gap: "1rem",
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
export function WinnerScreen(
  { lobby, turn, user, judge, players, responses }: TurnProps
) {
  const [startingNewTurn, setStartingNewTurn] = useState(false);
  const [ending, setEnding] = useState(false);
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;
  const winner = players.find((p) => p.uid === turn.winner_uid);

  const winnerResponse = responses.find((r) => r.player_uid === turn.winner_uid);
  const shouldEndNow = checkIfShouldEndGame(lobby, turn, players);
  const audienceAwardResponses = responses
    .filter((r) => turn.audience_award_uids.includes(r.player_uid));
  const showAudienceAward = audienceAwardResponses.length > 0;

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

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }}>
      {winner ? <>Winner <i>{winner.name}</i></> :
        <Delay>No winner</Delay>}
    </h2>
    <div style={midRowStyle}>
      <CardPromptWithCzar card={turn.prompt} judge={isJudge ? null : judge} />
      {winnerResponse && (
        <ResponseReading lobby={lobby} turn={turn} response={winnerResponse} />
      )}
    </div>
    {/* TODO: animate audience choice winner transition */}
    {showAudienceAward && (
      <Delay delayMs={2000}>
        <div className="audience-award-section">
          <h2 style={{ textAlign: "center" }}>Audience Choice Award</h2>
          <div style={midRowStyle}>
            {audienceAwardResponses.map((r, i) => (
              <ResponseReadingWithName key={i} showLikes
                lobby={lobby} turn={turn} response={r} />
            ))}
          </div>
        </div>
      </Delay>
    )}
    <div style={botRowStyle} className="winner-control-row">
      {isJudge && (
        <Delay delayMs={showAudienceAward ? 3000 : 1000}>
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
  </CenteredLayout>
}