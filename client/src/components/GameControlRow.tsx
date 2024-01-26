import { CSSProperties } from "react";
import {
  ResponseCardInGame
} from "../shared/types";
import { GameButton } from "./Buttons";
import { useGameContext } from "./GameContext";
import { IconStarInline } from "./Icons";

interface ControlProps {
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

export function GameControlRow({
  selection, submitted, discarding, onToggleDiscard, discardedCards,
}: ControlProps) {
  const { lobby, prompt, player } = useGameContext();
  const picked = selection.length;
  const total = prompt?.pick ?? 1;

  // Discards:
  const cost = lobby.settings.discard_cost;
  const canDiscard = cost !== "no_discard";
  const discardCount = discardedCards.length;
  const isDiscardFree = cost === "free" ||
    cost === "1_free_then_1_star" && player.discards_used === 0;

  return (
    <div style={containerStyle}>
      <div style={leftStyle}></div>
      <div style={midStyle}>
        <span className="light" style={discardInfoStyle}>
          {discarding ? (
            isDiscardFree ? <>Discard any number of cards</> :
              <>Discard any number of cards for <i>1 <IconStarInline /></i></>
          ) : (
            submitted ? "Submitted!" : prompt ? (
              `Picked ${picked} out of ${total}`
            ) : "Waiting for prompt..."
          )}
        </span>
      </div>
      <div style={rightStyle}>
        {canDiscard && <>
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
            <GameButton secondary small onClick={() => onToggleDiscard(true)}
              title={isDiscardFree ? "Discard any number of cards for free" :
                "Discard any number of cards for ⭐ points"}>
              {isDiscardFree ? "Free discard" : <>Discard for 1 <IconStarInline /></>}
            </GameButton>
          )}
        </>}
      </div>
    </div >
  );
}