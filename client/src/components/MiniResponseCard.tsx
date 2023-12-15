interface Props {
  ready: boolean,
  /** How many cards were played */
  pick: number,
  playerName: string,
}

/** Indicates whether a player responded */
export function MiniResponseCard({ ready, pick, playerName }: Props) {
  const readyClass = ready ? "ready" : "notready";
  const pickClass = pick > 1 ? "multiple" : "single";
  return (
    <div className="minicard-container">
      <div className={`game-minicard ${readyClass} ${pickClass}`} style={{
        textAlign: "center",
      }}>
        <div className="ready-icon" style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          alignContent: "center",
          justifyContent: "center",
        }}>
          <span>
            {ready ? "✔" : "···"}
          </span>
        </div>
      </div>
      <div className="minicard-player-name" style={{
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {playerName}
      </div>
    </div>
  );
}