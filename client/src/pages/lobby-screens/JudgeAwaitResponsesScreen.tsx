import { User } from "firebase/auth";
import { MiniResponseCard } from "../../components/MiniResponseCard";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { useAllPlayerResponses } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
import { usePlayers } from "../../model/lobby-api";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Similar to GameMiniResponses, but slightly different */
export function JudgeAwaitResponsesScreen({ lobby, turn }: TurnProps) {
  // const players = dummyPlayers;
  const [players] = usePlayers(lobby.id);
  const [responses] = useAllPlayerResponses(lobby, turn);
  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses?.find((res) => res.player_uid === player.uid) ?? null;
  }
  return <CenteredLayout style={{
    display: "flex",
    flexFlow: "wrap",
    justifyContent: "center",
    gap: "1rem",
  }}>
    {players?.filter((p) => p.role === "player")?.map((player) => {
      const response = findResponse(player);
      return <MiniResponseCard
        key={player.uid}
        playerName={player.name}
        ready={response != null}
        pick={turn.prompt?.pick ?? 0} />
    })}
  </CenteredLayout>;
}