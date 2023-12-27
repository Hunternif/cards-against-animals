import { CSSProperties } from "react";
import {
  GameTurn,
  PlayerDataInTurn,
  ResponseCardInGame
} from "../shared/types";
import { GameButton } from "./Buttons";

interface ControlProps {
  turn: GameTurn,
  data?: PlayerDataInTurn,
  selection: ResponseCardInGame[],
  submitted: boolean,
  discarding: boolean,
  onToggleDiscard: (enabled: boolean) => void,
}

const containerStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1em",
  gap: "0.5em",
};
const equalSizeStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0%",
};
const leftStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0%",
  display: "flex",
  justifyContent: "flex-start",
};
const midStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: "50%",
  display: "flex",
  justifyContent: "center",
};
const rightStyle: CSSProperties = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0%",
  display: "flex",
  gap: "0.75em",
  justifyContent: "flex-end",
};

export function GameControlRow(
  {
    turn, data, selection, submitted,
    discarding, onToggleDiscard,
  }: ControlProps
) {
  const picked = selection.length;
  const total = turn.prompt?.pick ?? 1;

  return (
    <div style={containerStyle}>
      <div style={leftStyle}></div>
      <div style={midStyle}>
        <span className="light" style={{ padding: "0.5rem 0" }}>
          {discarding ? (
            <>Discard any number of cards for <i>1 point</i></>
          ) : !data ? (
            // Assume we just joined the game in the middle of it:
            "Wait for next turn"
          ) : (
            submitted ? "Submitted!" : turn.prompt ? (
              `Picked ${picked} out of ${total}`
            ) : "Waiting for prompt..."
          )}
        </span>
      </div>
      <div style={rightStyle}>
        {discarding ? (<>
          <GameButton small onClick={() => onToggleDiscard(false)}>Done</GameButton>
        </>) : (
          <GameButton secondary small onClick={() => onToggleDiscard(true)}>Discard...</GameButton>
        )}
      </div>
    </div >
  );
}