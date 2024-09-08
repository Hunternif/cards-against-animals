import { ReactNode, useState } from 'react';
import {
  Deck,
  DeckCard,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import {
  CardBottomRight,
  CardContent,
  LargeCard,
} from '../../lobby-screens/game-components/LargeCard';
import { PromptPick } from '../../lobby-screens/game-components/CardPrompt';
import {
  filterPromptDeckCard,
  filterResponseDeckCard,
  formatPrompt,
} from '../../../shared/deck-utils';
import { useClickOutside } from '../../../hooks/ui-hooks';

interface Props {
  deck?: Deck;
  /** If undefined, the modal is hidden */
  card?: DeckCard;
  onChange?: () => void;
}

/**
 * UI to edit the content of a card.
 * Modifies the card instance directly!
 */
export function CardEditor({ deck, card, onChange }: Props) {
  const cardClasses = ['editable-card'];
  const isPrompt = card && filterPromptDeckCard(card);
  const isResponse = card && filterResponseDeckCard(card);
  if (isPrompt) cardClasses.push('card-prompt');
  if (isResponse) cardClasses.push('card-response');

  // This forces redender:
  const [dirty, setDirty] = useState(false);

  function handleChange() {
    setDirty(true);
    if (onChange) onChange();
  }

  if (dirty) setDirty(false);

  return (
    <div className='card-editor'>
      <LargeCard className={cardClasses.join(' ')}>
        <EditableCardContent
          original={card?.content}
          onChange={(c) => {
            if (card) card.content = c;
            handleChange();
          }}
          isPrompt={isPrompt}
        />
        {isPrompt && card.pick > 1 && (
          <CardBottomRight>
            <PromptPick pick={card.pick} />
          </CardBottomRight>
        )}
      </LargeCard>
      {isPrompt && <PromptStats deck={deck} card={card} />}
      {isResponse && <ResponseStats deck={deck} card={card} />}
    </div>
  );
}

interface EditableContentProps {
  original?: string;
  onChange: (newValue: string) => void;
  isPrompt?: boolean;
}
function EditableCardContent({
  original,
  onChange,
  isPrompt,
}: EditableContentProps) {
  const [edit, setEdit] = useState(false);

  // To auto-hide text area when clicking outside.
  const textAreaRef = useClickOutside<HTMLTextAreaElement>(() =>
    setEdit(false),
  );

  if (edit)
    return (
      <textarea
        autoFocus
        onFocus={(e) => {
          // set cursor to the end of the text:
          e.target.setSelectionRange(
            e.target.value.length,
            e.target.value.length,
          );
        }}
        ref={textAreaRef}
        defaultValue={original}
        onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue);
        }}
      />
    );
  else
    return (
      <CardContent
        onClick={() => {
          setEdit(true);
        }}
      >
        {original && isPrompt ? formatPrompt(original) : original}
      </CardContent>
    );
}

interface PropmtStatsProps {
  deck?: Deck;
  card: PromptDeckCard;
}
function PromptStats({ deck, card }: PropmtStatsProps) {
  return (
    <dl className="stats">
      <StatsRow label="Deck">{deck?.title}</StatsRow>
      <StatsRow label="ID">{card.id}</StatsRow>
      <StatsRow label="Tags">
        {card.tags.length > 0 ? card.tags.join(', ') : '-'}
      </StatsRow>
      <StatsRow label="Views">{card.views}</StatsRow>
      <StatsRow label="Plays">{card.plays}</StatsRow>
      <StatsRow label="Wins">{card.wins}</StatsRow>
      <StatsRow label="Discards">{card.discards}</StatsRow>
      <StatsRow label="Upvotes">{card.upvotes}</StatsRow>
      <StatsRow label="Downvotes">{card.downvotes}</StatsRow>
      <StatsRow label="Rating">{card.rating}</StatsRow>
    </dl>
  );
}

interface ResponseStatsProps {
  deck?: Deck;
  card: ResponseDeckCard;
}
function ResponseStats({ deck, card }: ResponseStatsProps) {
  return (
    <dl className="stats">
      <StatsRow label="Deck">{deck?.title ?? '-'}</StatsRow>
      <StatsRow label="ID">{card.id}</StatsRow>
      <StatsRow label="Tags">
        {card.tags.length > 0 ? card.tags.join(', ') : '-'}
      </StatsRow>
      <StatsRow label="Views">{card.views}</StatsRow>
      <StatsRow label="Plays">{card.plays}</StatsRow>
      <StatsRow label="Likes">{card.likes}</StatsRow>
      <StatsRow label="Wins">{card.wins}</StatsRow>
      <StatsRow label="Discards">{card.discards}</StatsRow>
      <StatsRow label="Rating">{card.rating}</StatsRow>
      <StatsRow label="Action">{card.action ?? '-'}</StatsRow>
    </dl>
  );
}

interface StatsRowProps {
  label: string;
  children: ReactNode;
}
function StatsRow({ label, children }: StatsRowProps) {
  return (
    <div className="stats-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}