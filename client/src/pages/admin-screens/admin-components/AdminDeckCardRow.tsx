import { CSSProperties, ReactNode } from 'react';
import { isOnlyEmojis } from '../../../api/deck/deck-parser';
import { GameButton } from '../../../components/Buttons';
import { Twemoji } from '../../../components/Twemoji';
import {
  DeckCard,
  defaultLobbySettings,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import { inferCardTier } from '../../../shared/deck-utils';

interface RowProps {
  card: DeckCard;
  selected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  isErrored?: boolean;
}

export const adminDeckRowHeight = 22;
const borderWidth = 2;
export const adminDeckRowHeightWithBorder = adminDeckRowHeight + borderWidth;
const rowStyle: CSSProperties = {
  height: adminDeckRowHeight,
};

export function AdminDeckCardRow({
  card,
  selected,
  onClick,
  onEdit,
  isErrored,
}: RowProps) {
  const isPrompt = card instanceof PromptDeckCard;
  const likeCount =
    card instanceof ResponseDeckCard
      ? card.likes
      : card instanceof PromptDeckCard
      ? card.upvotes - card.downvotes
      : 0;
  const classes = ['card-row'];
  classes.push(selected ? 'selected' : 'selectable');
  classes.push(isPrompt ? 'row-prompt' : 'row-response');
  if (card instanceof ResponseDeckCard && card.action)
    classes.push('action-card');
  if (isErrored) classes.push('errored');
  // TODO: render column by column.
  return (
    <tr className={classes.join(' ')} onClick={onClick}>
      <td className="col-card-id">{card.id}</td>
      <td
        className="col-card-content"
        style={rowStyle}
        onClick={(e) => {
          e.stopPropagation(); // prevent selecting the row
          if (onEdit) onEdit();
        }}
      >
        <CardContentRow>{card.content}</CardContentRow>
        <EditButton />
        {isPrompt && <div className="prompt-pick-number">{card.pick}</div>}
      </td>
      <td className="col-card-tags">{card.tags.join(', ')}</td>
      <CounterRow val={card.views} />
      <CounterRow val={card.plays} />
      <CounterRow val={likeCount} />
      <CounterRow val={card.wins} />
      <CounterRow val={card.discards} />
      <CounterRow val={card.rating} />
      <CardTierRow card={card} />
    </tr>
  );
}

function CounterRow({ val }: { val: number }) {
  const classes = new Array<string>();
  classes.push('col-card-counter');
  if (val === 0) classes.push('empty');
  return <td className={classes.join(' ')}>{val}</td>;
}

interface CardContentRowProps {
  children: ReactNode;
}
export function CardContentRow(props: CardContentRowProps) {
  const content = props.children?.toString() ?? '';
  const emojiClass = isOnlyEmojis(content) ? 'emoji-only ' : '';
  return (
    <Twemoji {...props} className={`card-content-admin-row ${emojiClass}`} />
  );
}

function CardTierRow({ card }: { card: DeckCard }) {
  const classes = ['col-card-tier'];
  let tier = card.tier;
  if (tier) {
    classes.push('assigned');
  } else {
    tier = inferCardTier(card, defaultLobbySettings());
    classes.push('inferred');
  }
  classes.push(`tier-${tier}`);
  return <td className={classes.join(' ')}>{tier}</td>;
}

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="edit-button-container">
      <GameButton
        tiny
        className="edit-button"
        // Do nothing on click, because the entire column is clickable
        // onClick={(e) => {
        //   e.stopPropagation(); // prevent selecting the row
        //   if (onClick) onClick();
        // }}
      >
        Edit
      </GameButton>
    </div>
  );
}
