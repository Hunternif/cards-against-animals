import { PlayerInLobby, PlayerResponse } from "../shared/types";
import { useGameContext } from "./GameContext";
import { MiniCardResponse } from "./MiniCardResponse";

interface Props {
  players: PlayerInLobby[],
}

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Indicates which players responded */
export function GameMiniResponses({ players }: Props) {
  // const players = dummyPlayers;
  const { prompt, responses } = useGameContext();

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }

  return <div style={{
    flex: "1 1 auto",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
    overflow: "hidden",
    maxWidth: "100vw",
  }}>
    {players && players.map((player) => {
      const response = findResponse(player);
      return <MiniCardResponse
        key={player.uid}
        playerName={player.name}
        ready={response != null}
        pick={prompt?.pick ?? 0} />
    })}
  </div>;
}