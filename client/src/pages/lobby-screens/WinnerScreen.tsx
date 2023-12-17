import { User } from "@firebase/auth";
import { GameLobby, GameTurn } from "../../shared/types";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { usePlayers } from "../../model/lobby-api";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CSSProperties } from "react";
import { PromptCard } from "../../components/Cards";
import { ResponseReading } from "../../components/ResponseReading";
import { useAllPlayerResponses } from "../../model/turn-api";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

const midRowStyle: CSSProperties = {
  display: "flex",
  flexFlow: "wrap",
  justifyContent: "center",
  // alignItems: "center",
  gap: "1rem",
}

/** Displays winner of the turn */
export function WinnerScreen({ lobby, turn, user }: TurnProps) {
  const [players] = usePlayers(lobby.id);
  const [responses] = useAllPlayerResponses(lobby, turn);
  const winner = players && players.find((p) => p.uid === turn.winner_uid);
  const winnerResponse = responses &&
    responses.find((r) => r.player_uid === turn.winner_uid);
  if (!winner) return <LoadingSpinner delay text="Loading..." />
  return <CenteredLayout>
    <h2 style={{ textAlign: "center" }}><i>Winner: {winner.name}</i></h2>
    <div style={midRowStyle}>
      <PromptCard card={turn.prompt} />
      {winnerResponse && <ResponseReading response={winnerResponse} />}
    </div>
  </CenteredLayout>
}