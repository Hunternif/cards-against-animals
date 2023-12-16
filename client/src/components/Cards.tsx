import { CardInGame, PromptCardInGame } from "../shared/types";
import { FillLayout } from "./layout/FillLayout";

interface PromptCardProps {
  card: PromptCardInGame,
}

interface ResponseCardProps {
  card: CardInGame,
  selectable?: boolean,
  /** Which card it is in your submission: #1, #2 etc. Starts from 0. */
  selectedIndex?: number,
  /** Whether to show the above index. Doesn't make sense for 1 card. */
  showIndex?: boolean,
  onToggle?: (selected: boolean) => void,
}

interface PickProps {
  pick: number,
}

export function PromptCard({ card }: PromptCardProps) {
  return <div className="game-card card-prompt" style={{
    display: "flex",
    flexDirection: "column",
  }}>
    <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    {card.pick > 1 && <PromptCardPick pick={card.pick} />}
  </div>;
}

export function ResponseCard(
  { card, selectable, selectedIndex, showIndex, onToggle }: ResponseCardProps
) {
  const selected = selectedIndex != undefined && selectedIndex > -1;
  const selectableStyle = selectable ? "hoverable-card" : "locked-card";
  const selectedStyle = selected ? "selected" : "unselected";
  const className = `game-card card-response ${selectableStyle} ${selectedStyle}`;
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div className={className} onClick={handleClick}>
    <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    {showIndex && selected && <FillLayout
      className="selected-response-index"
      style={{
        display: "flex",
        flexWrap: "wrap",
        position: "absolute",
        top: 0,
        left: 0,
      }}>
      {selectedIndex + 1}
    </FillLayout>}
  </div>;
}

function PromptCardPick({ pick }: PickProps) {
  return <>
    <div className="prompt-pick" style={{
      display: "flex",
      alignItems: "baseline",
      flexDirection: "row",
      marginTop: "auto",
      marginLeft: "auto",
    }}>
      PICK
      <div className="prompt-pick-number" style={{
        textAlign: "center",
        borderRadius: "50%",
        width: "1rem",
        height: "1rem",
        lineHeight: "1rem",
        marginLeft: "0.5em",
        backgroundColor: "#fff",
        color: "#000",
        fontWeight: "bold",
      }}>
        {pick}
      </div>
    </div>
  </>;
}