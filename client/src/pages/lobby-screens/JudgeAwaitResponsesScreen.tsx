import { User } from "firebase/auth";
import { CSSProperties, useContext } from "react";
import { GameButton } from "../../components/Buttons";
import { PromptCard } from "../../components/Cards";
import { ErrorContext } from "../../components/ErrorContext";
import { MiniResponseCard } from "../../components/MiniResponseCard";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { startReadingPhase } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
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
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Similar to GameMiniResponses, but slightly different */
export function JudgeAwaitResponsesScreen(
  { lobby, turn, user, players, responses }: TurnProps
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
    p.role === "player" && p.uid !== turn.judge_uid
  );
  const allResponded = validPlayers && validPlayers.every((p) =>
    findResponse(p)
  );

  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }} className="dim">Wait for responses:</h2>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {validPlayers && validPlayers.map((player) => {
        const response = findResponse(player);
        return <MiniResponseCard
          key={player.uid}
          playerName={player.name}
          ready={response != null}
          pick={turn.prompt?.pick ?? 0} />
      })}
    </div>
    <div style={botRowStyle}>
      {allResponded && isJudge && (<>
        <span>All players responded!</span>
        <GameButton accent onClick={handleNext}>Next</GameButton>
      </>)}
    </div>
  </CenteredLayout>;
}