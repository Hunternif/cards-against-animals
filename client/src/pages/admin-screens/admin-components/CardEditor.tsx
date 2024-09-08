import { ReactNode, useState } from 'react';
import { NumberInput, SelectInput } from '../../../components/FormControls';
import { useClickOutside } from '../../../hooks/ui-hooks';
import {
  filterPromptDeckCard,
  filterResponseDeckCard,
  formatPrompt,
} from '../../../shared/deck-utils';
import {
  allCardActions,
  Deck,
  DeckCard,
  PromptDeckCard,
  ResponseDeckCard,
} from '../../../shared/types';
import { PromptPick } from '../../lobby-screens/game-components/CardPrompt';
import {
  CardBottomRight,
  CardContent,
  LargeCard,
} from '../../lobby-screens/game-components/LargeCard';

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
  if (isResponse && card.action) cardClasses.push('action-card');

  // This forces redender:
  const [dirty, setDirty] = useState(false);

  function handleChange() {
    setDirty(true);
    if (onChange) onChange();
  }

  if (dirty) setDirty(false);

  return (
    <div className="card-editor">
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
      {isPrompt && (
        <PromptStats deck={deck} card={card} onChange={handleChange} />
      )}
      {isResponse && (
        <ResponseStats deck={deck} card={card} onChange={handleChange} />
      )}
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
  onChange?: () => void;
}
function PromptStats({ deck, card, onChange }: PropmtStatsProps) {
  return (
    <dl className="stats">
      <StatsRow label="Deck">{deck?.title}</StatsRow>
      <StatsRow label="ID">{card.id}</StatsRow>
      <StatsRow label="Tags">
        {card.tags.length > 0 ? card.tags.join(', ') : '-'}
      </StatsRow>
      <StatsRow label="Pick">
        <NumberPropInput obj={card} prop="pick" min={1} onChange={onChange} />
      </StatsRow>
      <hr />
      <header>Statistics</header>
      <StatsRow label="Views">
        <NumberPropInput obj={card} prop="views" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Plays">
        <NumberPropInput obj={card} prop="plays" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Wins">
        <NumberPropInput obj={card} prop="wins" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Discards">
        <NumberPropInput obj={card} prop="discards" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Upvotes">
        <NumberPropInput obj={card} prop="upvotes" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Downvotes">
        <NumberPropInput obj={card} prop="downvotes" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Rating">
        <NumberPropInput
          obj={card}
          prop="rating"
          min={-9999}
          onChange={onChange}
        />
      </StatsRow>
    </dl>
  );
}

interface ResponseStatsProps {
  deck?: Deck;
  card: ResponseDeckCard;
  onChange?: () => void;
}
function ResponseStats({ deck, card, onChange }: ResponseStatsProps) {
  return (
    <dl className="stats">
      <StatsRow label="Deck">{deck?.title ?? '-'}</StatsRow>
      <StatsRow label="ID">{card.id}</StatsRow>
      <StatsRow label="Tags">
        {card.tags.length > 0 ? card.tags.join(', ') : '-'}
      </StatsRow>
      <StatsRow label="Action">
        <SelectInput
          tiny
          value={card.action ?? 'none'}
          options={allCardActions.map((a) => [a, a])}
          onChange={(v) => {
            card.action = v === 'none' ? undefined : v;
            if (onChange) onChange();
          }}
        />
      </StatsRow>
      <hr />
      <header>Statistics</header>
      <StatsRow label="Views">
        <NumberPropInput obj={card} prop="views" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Plays">
        <NumberPropInput obj={card} prop="plays" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Likes">
        <NumberPropInput obj={card} prop="likes" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Wins">
        <NumberPropInput obj={card} prop="wins" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Discards">
        <NumberPropInput obj={card} prop="discards" onChange={onChange} />
      </StatsRow>
      <StatsRow label="Rating">
        <NumberPropInput
          obj={card}
          prop="rating"
          min={-9999}
          onChange={onChange}
        />
      </StatsRow>
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

interface NumberPropertyInputProps<P extends string> {
  obj: Record<P, number>;
  prop: P;
  onChange?: () => void;
  min?: number; // defaults to 0
  max?: number; // defaults to 9999
}
/** Helper component to shorten */
function NumberPropInput<P extends string>({
  obj,
  prop,
  onChange,
  min,
  max,
}: NumberPropertyInputProps<P>) {
  return (
    <NumberInput
      tiny
      value={obj[prop]}
      min={min == null ? 0 : min}
      max={max == null ? 9999 : max}
      step={1}
      onChange={(val) => {
        obj[prop] = val;
        if (onChange) onChange();
      }}
    />
  );
}
