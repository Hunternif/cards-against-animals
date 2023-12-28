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
  discardedCards: ResponseCardInGame[],
}

const containerStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1em",
  gap: "1em",
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
  flexBasis: "0%",
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
  alignItems: "center",
};
const discardInfoStyle: CSSProperties = {
  padding: "0.5rem 0",
  whiteSpace: "nowrap",
  textAlign: "center",
};
const discardCountStyle: CSSProperties = {
  whiteSpace: "nowrap",
};

export function GameControlRow(
  {
    turn, data, selection, submitted,
    discarding, onToggleDiscard, discardedCards,
  }: ControlProps
) {
  const picked = selection.length;
  const total = turn.prompt?.pick ?? 1;
  const discardCount = discardedCards.length;

  return (
    <div style={containerStyle}>
      <div style={leftStyle}></div>
      <div style={midStyle}>
        <span className="light" style={discardInfoStyle}>
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
        {!discarding && discardCount > 0 &&
          <span className="light" style={discardCountStyle}>
            Will discard {discardCount} cards
          </span>}
        {discarding ? (<>
          <span className="light" style={discardCountStyle}>
            Will discard {discardCount} cards
          </span>
          <GameButton small onClick={() => onToggleDiscard(false)}>Done</GameButton>
        </>) : (
          <GameButton secondary small onClick={() => onToggleDiscard(true)}>Discard...</GameButton>
        )}
      </div>
    </div >
  );
}