import { IconCheck } from "../../../components/Icons";
import { PlayerAvatar } from "../../../components/PlayerAvatar";
import { PlayerInLobby } from "@shared/types";

interface Props {
  ready: boolean,
  /** How many cards were played */
  pick: number,
  player: PlayerInLobby,
}

/** Indicates whether a player responded */
export function MiniCardResponse({ ready, pick, player }: Props) {
  const readyClass = ready ? "ready" : "notready";
  const pickClass = pick > 1 ? "multiple" : "single";
  return (
    <div className="minicard-container">
      <div className={`game-minicard ${readyClass} ${pickClass}`} style={{
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <span className="ready-icon">
          {ready ? <IconCheck width={52} height={52} className="tick"/> : "···"}
        </span>
      </div>
      <div className="minicard-player-name" style={{
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        textAlign: "center",
      }}>
        <PlayerAvatar player={player} />
        <span className="player-name">{player.name}</span>
      </div>
    </div>
  );
}