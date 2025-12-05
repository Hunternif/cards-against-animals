import { ResponseCardInGame } from '../../../shared/types';
import { Downvote } from './CardVotes';
import { IconRecycle, IconTrash } from '../../../components/Icons';
import {
  CardBottomRight,
  CardCenterIcon,
  CardContent,
  LargeCard,
} from './LargeCard';

interface ResponseCardProps {
  card: ResponseCardInGame;
  justIn?: boolean; // Card was just dealt
  downvoted?: boolean;
  selectable?: boolean;
  downvotable?: boolean;
  /** Which card it is in your submission: #1, #2 etc. Starts from 0. */
  selectedIndex?: number;
  /** Whether to show the above index. Doesn't make sense for 1 card. */
  showIndex?: boolean;
  onToggle?: (selected: boolean) => void;
  onToggleDownvote?: (downvoted: boolean) => void;
  discarding?: boolean;
  discarded?: boolean;
  onToggleDiscard?: (discarded: boolean) => void;
}

export function CardResponse({
  card,
  justIn,
  downvoted,
  selectable,
  downvotable,
  selectedIndex,
  showIndex,
  onToggle,
  onToggleDownvote,
  discarding,
  discarded,
  onToggleDiscard,
}: ResponseCardProps) {
  const selected = selectedIndex != undefined && selectedIndex > -1;
  const classes = ['card-response'];
  if (justIn) classes.push('just-in');
  classes.push(selectable ? 'hoverable-card' : 'locked-card');
  classes.push(selected ? 'selected' : 'unselected');
  if (discarding) classes.push('discarding');
  if (discarded) classes.push('discarded');
  if (downvoted) classes.push('downvoted');
  if (card.action) classes.push('action-card');

  function handleClick() {
    if (discarding) {
      if (onToggleDiscard) onToggleDiscard(!discarded);
    } else {
      if (onToggle && selectable) onToggle(!selected);
    }
  }

  async function handleDownvote() {
    if (onToggleDownvote && selectable) onToggleDownvote(!downvoted);
  }

  return (
    <LargeCard className={classes.join(' ')} onClick={handleClick}>
      <CardContent>{card.content}</CardContent>
      {showIndex && selected && (
        <CardCenterIcon className="selected-response-index">
          {selectedIndex + 1}
        </CardCenterIcon>
      )}
      {discarding || discarded ? (
        <CardCenterIcon>
          <IconRecycle width={100} height={100} className="card-discard-icon" />
        </CardCenterIcon>
      ) : null}
      <CardBottomRight>
        {downvotable ? <Downvote onClick={handleDownvote} /> : null}
      </CardBottomRight>
    </LargeCard>
  );
}
