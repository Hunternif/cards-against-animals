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
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <span className="ready-icon">
          {ready ? "✔" : "···"}
        </span>
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