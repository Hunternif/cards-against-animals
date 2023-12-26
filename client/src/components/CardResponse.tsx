import { CardInGame } from "../shared/types";
import { IconThumbsDown, IconTrash } from "./Icons";
import { CardBottomRight, CardCenterIcon, CardContent, LargeCard } from "./LargeCard";

interface ResponseCardProps {
  card: CardInGame,
  selectable?: boolean,
  /** Which card it is in your submission: #1, #2 etc. Starts from 0. */
  selectedIndex?: number,
  /** Whether to show the above index. Doesn't make sense for 1 card. */
  showIndex?: boolean,
  onToggle?: (selected: boolean) => void,
  onToggleDownvote?: (downvoted: boolean) => void,
  discarding?: boolean,
  discarded?: boolean,
  onToggleDiscard?: (discarded: boolean) => void,
}

export function CardResponse(
  {
    card, selectable, selectedIndex, showIndex, onToggle, onToggleDownvote,
    discarding, discarded, onToggleDiscard,
  }: ResponseCardProps
) {
  const selected = selectedIndex != undefined && selectedIndex > -1;
  const selectableStyle = selectable ? "hoverable-card" : "locked-card";
  const selectedStyle = selected ? "selected" : "unselected";
  const discardingStyle = discarding ? "discarding" : "";
  const discardedStyle = discarded ? "discarded" : "";
  const voteStyle = card.downvoted ? "downvoted" : "";
  const className = `card-response ${selectableStyle} ${selectedStyle} ${voteStyle} ${discardingStyle} ${discardedStyle}`;

  function handleClick() {
    if (discarding) {
      if (onToggleDiscard) onToggleDiscard(!discarded);
    } else {
      if (onToggle && selectable) onToggle(!selected);
    }
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
      {(discarding || discarded) && (
        <CardCenterIcon className="card-discard-icon">
          <IconTrash width={64} height={64} />
        </CardCenterIcon>
      )}
      <CardBottomRight>
        <Downvote onClick={handleDownvote} />
      </CardBottomRight>
    </LargeCard>
  );
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