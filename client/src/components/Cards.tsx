import { CSSProperties } from "react";
import { CardInGame, PromptCardInGame } from "../shared/types";
import { IconThumbsDown } from "./Icons";
import { FillLayout } from "./layout/FillLayout";

interface PromptCardProps {
  /** Undefined while the judge hasn't picked a prompt yet */
  card: PromptCardInGame | undefined | null,
}

interface ResponseCardProps {
  card: CardInGame,
  selectable?: boolean,
  /** Which card it is in your submission: #1, #2 etc. Starts from 0. */
  selectedIndex?: number,
  /** Whether to show the above index. Doesn't make sense for 1 card. */
  showIndex?: boolean,
  onToggle?: (selected: boolean) => void,
  onToggleDownvote?: (downvoted: boolean) => void,
}

interface PickProps {
  pick: number,
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  flexShrink: "0",
}

const fillCardStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  position: "absolute",
  top: 0,
  left: 0,
}

/** Formats gaps to be longer. */
function formatPrompt(text: string): string {
  return text.replace(/_+/g, "______");
}

export function PromptCard({ card }: PromptCardProps) {
  return <div className="game-card card-prompt" style={containerStyle}>
    {card ? (<>
      <span style={{ whiteSpace: "pre-line" }}>
        {formatPrompt(card.content)}
      </span>
      {card.pick > 1 && <PromptCardPick pick={card.pick} />}
    </>) :
      <FillLayout className="prompt-unknown-icon" style={fillCardStyle} >
        ?
      </FillLayout>}
  </div>;
}

export function ResponseCard(
  { card, selectable, selectedIndex, showIndex, onToggle, onToggleDownvote }: ResponseCardProps
) {
  const selected = selectedIndex != undefined && selectedIndex > -1;
  const selectableStyle = selectable ? "hoverable-card" : "locked-card";
  const selectedStyle = selected ? "selected" : "unselected";
  const voteStyle = card.downvoted ? "downvoted" : "";
  const className = `game-card card-response ${selectableStyle} ${selectedStyle} ${voteStyle}`;

  function handleClick() {
    if (onToggle && selectable) onToggle(!selected);
  }

  async function handleDownvote() {
    if (onToggleDownvote && selectable) onToggleDownvote(!card.downvoted);
  }

  return <div className={className} onClick={handleClick} style={containerStyle}>
    <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    <Downvote onClick={handleDownvote} />
    {showIndex && selected && <FillLayout
      className="selected-response-index"
      style={fillCardStyle}>
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

interface DownvoteProps {
  onClick?: () => void,
}

function Downvote({ onClick }: DownvoteProps) {
  return <div className="downvote-card-icon" style={{
    display: "flex",
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: "auto",
    marginLeft: "auto",
  }}
    title="Downvote card"
    onClick={(e) => {
      e.stopPropagation();
      if (onClick) onClick();
    }}>
    <IconThumbsDown width={24} height={24} />
  </div>;
}