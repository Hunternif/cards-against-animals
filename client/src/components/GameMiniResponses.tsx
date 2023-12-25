import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse } from "../shared/types";
import { MiniCardResponse } from "./MiniCardResponse";

interface Props {
  lobby: GameLobby,
  turn: GameTurn,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Indicates which players responded */
export function GameMiniResponses({ turn, players, responses }: Props) {
  // const players = dummyPlayers;

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }

  // Filter out spectators and the judge:
  const validPlayers = players.filter((p) =>
    p.role === "player" && p.status !== "left" && p.uid !== turn.judge_uid
  );

  return <div style={{
    flex: "1 1 auto",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
    overflow: "hidden",
    maxWidth: "100vw",
  }}>
    {validPlayers && validPlayers.map((player) => {
      const response = findResponse(player);
      return <MiniCardResponse
        key={player.uid}
        playerName={player.name}
        ready={response != null}
        pick={turn.prompt?.pick ?? 0} />
    })}
  </div>;
}