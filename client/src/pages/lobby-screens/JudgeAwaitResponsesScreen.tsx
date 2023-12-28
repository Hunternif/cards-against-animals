import { User } from "firebase/auth";
import { CSSProperties, useContext } from "react";
import { GameButton } from "../../components/Buttons";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { MiniCardResponse } from "../../components/MiniCardResponse";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { startReadingPhase } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
import { ScreenSizeSwitch } from "../../components/layout/ScreenSizeSwitch";
import { ResponseCount } from "../../components/ResponseCount";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  judge?: PlayerInLobby,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const topRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  gap: "1rem",
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  gap: "1rem",
}

const botRowStyle: CSSProperties = {
  marginTop: "1.5rem",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
  height: "3em",
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Similar to GameMiniResponses, but slightly different */
export function JudgeAwaitResponsesScreen(
  { lobby, turn, user, judge, players, responses }: TurnProps
) {
  // const players = dummyPlayers;
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }

  async function handleNext() {
    await startReadingPhase(lobby, turn).catch((e) => setError(e));
  }

  // Filter out spectators and the judge:
  const validPlayers = players.filter((p) =>
    p.role === "player" && p.status !== "left" && p.uid !== turn.judge_uid
  );
  const allResponded = validPlayers && validPlayers.every((p) =>
    findResponse(p)
  );

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }} className="dim">Wait for responses:</h2>
    <div style={midRowStyle}>
      <CardPromptWithCzar card={turn.prompt}
        judge={isJudge ? null : judge} />
      <ScreenSizeSwitch
        widthBreakpoint={500}
        smallScreen={
          <ResponseCount players={validPlayers} responses={responses} />
        }
        bigScreen={
          <DetailedResponses players={validPlayers} responses={responses}
            pick={turn.prompt?.pick ?? 0} />
        }
      />
    </div>
    <div style={botRowStyle}>
      {allResponded && isJudge && (<>
        <span>All players responded!</span>
        <GameButton accent onClick={handleNext}>Next</GameButton>
      </>)}
    </div>
  </CenteredLayout>;
}

interface DetailedResponsesProps {
  pick: number,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

function DetailedResponses({ pick, players, responses }: DetailedResponsesProps) {
  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }
  return <>{players && players.map((player) => {
    const response = findResponse(player);
    return <MiniCardResponse
      key={player.uid}
      playerName={player.name}
      ready={response != null}
      pick={pick} />
  })}</>;
}