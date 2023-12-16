import { usePlayers } from "../model/lobby-api";
import { useAllPlayerResponses } from "../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../shared/types";
import { MiniResponseCard } from "./MiniResponseCard";

interface Props {
  lobby: GameLobby,
  turn: GameTurn,
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Indicates which players responded */
export function GameMiniResponses({ lobby, turn }: Props) {
  // const players = dummyPlayers;
  const [players] = usePlayers(lobby.id);
  const [responses] = useAllPlayerResponses(lobby, turn);
  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses?.find((res) => res.player_uid === player.uid) ?? null;
  }
  return <div style={{
    flex: "1 1 auto",
    display: "flex",
    flexFlow: "nowrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
    overflow: "hidden",
    maxWidth: "100vw",
  }}>
    {players?.filter((p) => p.role === "player")?.map((player) => {
      const response = findResponse(player);
      return <MiniResponseCard
        key={player.uid}
        playerName={player.name}
        ready={response != null}
        pick={turn.prompt?.pick ?? 0} />
    })}
  </div>;
}