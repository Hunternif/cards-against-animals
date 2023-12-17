import { User } from "@firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
import { useAllPlayerResponses } from "../../model/turn-api";
import { usePlayers } from "../../model/lobby-api";
import { CSSProperties } from "react";
import { MiniResponseCard } from "../../components/MiniResponseCard";
import { PromptCard } from "../../components/Cards";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
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
  alignItems: "center",
  gap: "1rem",
}

export function CardReadingScreen({ lobby, turn, user }: TurnProps) {
  const [players] = usePlayers(lobby.id);
  const [responses] = useAllPlayerResponses(lobby, turn);
  const isJudge = turn.judge_uid === user.uid;

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses?.find((res) => res.player_uid === player.uid) ?? null;
  }

  // Filter out spectators and the judge:
  const validPlayers = players?.filter((p) =>
    p.role === "player" && p.uid !== turn.judge_uid
  );

  return <CenteredLayout>
    <div className={`game-bg phase-${turn.phase}`} />
    <div style={topRowStyle}>
      {isJudge && <h2>Reveal answers</h2>}
    </div>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt}/>
      {validPlayers && validPlayers.map((player) => {
        const response = findResponse(player);
        return <MiniResponseCard
          key={player.uid}
          playerName={player.name}
          ready={response != null}
          pick={turn.prompt?.pick ?? 0} />
      })}
    </div>
  </CenteredLayout>;
}
