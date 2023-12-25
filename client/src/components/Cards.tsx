import { CardInGame, PromptCardInGame } from "../shared/types";
import { IconThumbsDown } from "./Icons";
import { CardBottomRight, CardCenterIcon, CardContent, LargeCard } from "./LargeCard";

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

/** Formats gaps to be longer. */
function formatPrompt(text: string): string {
  return text.replace(/_+/g, "______");
}

export function PromptCard({ card }: PromptCardProps) {
  return (
    <LargeCard className="card-prompt">
      {card ? (<>
        <CardContent>{formatPrompt(card.content)}</CardContent>
        {card.pick > 1 && (
          <CardBottomRight>
            <PromptCardPick pick={card.pick} />
          </CardBottomRight>
        )}
      </>) : (
        <CardCenterIcon className="prompt-unknown-icon">
          ?
        </CardCenterIcon>
      )}
    </LargeCard>
  );
}

export function ResponseCard(
  { card, selectable, selectedIndex, showIndex, onToggle, onToggleDownvote }: ResponseCardProps
) {
  const selected = selectedIndex != undefined && selectedIndex > -1;
  const selectableStyle = selectable ? "hoverable-card" : "locked-card";
  const selectedStyle = selected ? "selected" : "unselected";
  const voteStyle = card.downvoted ? "downvoted" : "";
  const className = `card-response ${selectableStyle} ${selectedStyle} ${voteStyle}`;

  function handleClick() {
    if (onToggle && selectable) onToggle(!selected);
  }

  async function handleDownvote() {
    if (onToggleDownvote && selectable) onToggleDownvote(!card.downvoted);
  }

  return (
    <LargeCard className={className} onClick={handleClick}>
      <CardContent>{card.content}</CardContent>
      {showIndex && selected && (
        <CardCenterIcon className="selected-response-index">
          {selectedIndex + 1}
        </CardCenterIcon>
      )}
      <CardBottomRight>
        <Downvote onClick={handleDownvote} />
      </CardBottomRight>
    </LargeCard>
  );
}

function PromptCardPick({ pick }: PickProps) {
  return <>
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
  </>;
}

interface DownvoteProps {
  onClick?: () => void,
}

function Downvote({ onClick }: DownvoteProps) {
  return <div className="downvote-card-icon"
    title="Downvote card"
    onClick={(e) => {
      e.stopPropagation();
      if (onClick) onClick();
    }}>
    <IconThumbsDown width={24} height={24} />
  </div>;
}