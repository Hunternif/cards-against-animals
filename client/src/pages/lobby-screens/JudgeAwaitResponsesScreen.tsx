import { CSSProperties, useContext, useEffect } from "react";
import bell_double from '../../assets/bell_double.mp3';
import { GameButton } from "../../components/Buttons";
import { CardPromptWithCzar } from "../../components/CardPrompt";
import { ErrorContext } from "../../components/ErrorContext";
import { useGameContext } from "../../components/GameContext";
import { MiniCardResponse } from "../../components/MiniCardResponse";
import { ResponseCount } from "../../components/ResponseCount";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { ScreenSizeSwitch } from "../../components/layout/ScreenSizeSwitch";
import { startReadingPhase } from "../../model/turn-api";
import { PlayerInLobby, PlayerResponse } from "../../shared/types";

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
export function JudgeAwaitResponsesScreen() {
  // const players = dummyPlayers;
  const { lobby, turn, activePlayers, isJudge, prompt, judge, responses } = useGameContext();
  const { setError } = useContext(ErrorContext);

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }

  async function handleNext() {
    await startReadingPhase(lobby, turn).catch((e) => setError(e));
  }

  // Filter out the judge:
  const validPlayers = activePlayers.filter((p) => p.uid !== judge.uid);
  const allResponded = validPlayers.every((p) => findResponse(p));

  // Play sound when everyone has answered:
  useEffect(() => {
    if (allResponded) {
      new Audio(bell_double).play();
    }
  }, [allResponded]);

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }} className="dim">Wait for responses:</h2>
    <div style={midRowStyle}>
      <CardPromptWithCzar card={prompt} />
      <ScreenSizeSwitch
        widthBreakpoint={500}
        smallScreen={
          <ResponseCount />
        }
        bigScreen={
          <DetailedResponses players={validPlayers} responses={responses}
            pick={prompt?.pick ?? 0} />
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
      player={player}
      ready={response != null}
      pick={pick} />
  })}</>;
}