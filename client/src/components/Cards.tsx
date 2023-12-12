import { CardInGame, PromptCardInGame } from "../shared/types";

interface PromptCardProps {
  card: PromptCardInGame,
}

interface ResponseCardProps {
  card: CardInGame,
  selectable?: boolean,
  selected?: boolean,
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

export function ResponseCard({ card, selectable, selected, onToggle }: ResponseCardProps) {
  const selectableStyle = selectable ? "hoverable-card" : "";
  const selectedStyle = selected ? "selected" : "";
  const className = `game-card card-response ${selectableStyle} ${selectedStyle}`;
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div className={className} onClick={handleClick}>
    <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
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