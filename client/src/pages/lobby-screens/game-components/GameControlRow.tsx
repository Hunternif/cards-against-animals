import { CSSProperties } from "react";
import { GameButton } from "../../../components/Buttons";
import { IconStarInline } from "../../../components/Icons";
import {
  ResponseCardInGame
} from "../../../shared/types";
import { useGameContext } from "./GameContext";

interface ControlProps {
  selection: ResponseCardInGame[],
  submitted: boolean,
  discarding: boolean,
  onToggleDiscard: (enabled: boolean) => void,
  onDiscardAll: () => void,
  onUndiscardAll: () => void,
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
  display: "flex",
  justifyContent: "flex-start",
};
const midStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
};
const rightStyle: CSSProperties = {
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
  whiteSpace: "normal",
  minWidth: "10em",
  textAlign: "end",
};
const discardCountSmallStyle: CSSProperties = {
  whiteSpace: "nowrap",
  textAlign: "end",
};
const buttonGroupStyle: CSSProperties = {
  display: "flex",
  gap: "0.4em",
};

export function GameControlRow({
  selection, submitted, discarding, discardedCards,
  onToggleDiscard, onDiscardAll, onUndiscardAll,
}: ControlProps) {
  const { lobby, hand, prompt, player } = useGameContext();
  const picked = selection.length;
  const total = prompt?.pick ?? 1;

  // Discards:
  const cost = lobby.settings.discard_cost;
  const canDiscard = cost !== "no_discard";
  const totalDiscardable =
    hand.filter((c1) => !selection.find((c2) => c1.id === c2.id)).length;
  const discardCount = discardedCards.length;
  const isDiscardFree = cost === "free" ||
    cost === "1_free_then_1_star" && player.discards_used === 0;

  return (
    <div style={containerStyle}>
      <div className="layout-side-column" style={leftStyle}></div>
      <div className="layout-side-column" style={midStyle}>
        <span className="light" style={discardInfoStyle}>
          {discarding ? (
            isDiscardFree ?
              <>Select cards to discard.</> :
              <>Select cards to discard for <Cost b />.</>
          ) : (
            submitted ? "Submitted!" : prompt ? (
              `Picked ${picked} out of ${total}`
            ) : "Waiting for prompt..."
          )}
        </span>
      </div>
      <div className="layout-side-column" style={rightStyle}>
        {canDiscard && <>
          {discarding ? (
            <span className="light" style={discardCountSmallStyle}>
              <><b>{discardCount}</b> selected</>
            </span>
          ) : discardCount > 0 && (
            <span className="light" style={discardCountStyle}>
              <>Discarding <b>{discardCount}</b> cards
                {isDiscardFree ? <></> : <>for <Cost b /></>}...
              </>
            </span>
          )}
          {discarding ? (<div style={buttonGroupStyle}>
            {discardCount < totalDiscardable &&
              <GameButton small onClick={onDiscardAll}>Select all</GameButton>}
            {discardCount > 0 &&
              <GameButton small onClick={onUndiscardAll}>Clear</GameButton>}
            <GameButton small onClick={() => onToggleDiscard(false)}>Done</GameButton>
          </div>) : (
            <GameButton secondary small onClick={() => onToggleDiscard(true)}
              title={isDiscardFree ? "Discard any number of cards for free" :
                "Discard any number of cards for ⭐ points"}>
              {discardCount > 0 ? "Edit" :
                isDiscardFree ? "Free discard" : <>Discard: <Cost /></>}
            </GameButton>
          )}
        </>}
      </div>
    </div >
  );
}

interface CostProps {
  b?: boolean,
}
function Cost({ b }: CostProps) {
  return <i>
    {b ? <b>1</b> : <>1</>}<IconStarInline />
  </i>;
}