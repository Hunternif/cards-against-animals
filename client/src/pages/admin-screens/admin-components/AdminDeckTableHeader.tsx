import { ReactNode, useState } from 'react';
import { CardSortField, DeckCardSet } from '../../../api/deck/deck-card-set';
import { Checkbox } from '../../../components/Checkbox';
import { useScreenSize } from '../../../components/layout/ScreenSizeSwitch';

interface Props {
  cards: DeckCardSet;
  onToggleAll?: (checked: boolean) => void;
  selected?: DeckCardSet;
  readOnly?: boolean;
  onClickField?: (field: CardSortField, reverse?: boolean) => void;
}

/**
 * Advanced table header with extra controls on each column
 */
export function AdminDeckTableHeader({
  cards,
  onToggleAll,
  selected,
  readOnly,
  onClickField,
}: Props) {
  const isAnySelected = selected && selected.size > 0;

  return (
    <tr className="admin-deck-table-header">
      <th className="col-card-id">
        {readOnly ? (
          'ID'
        ) : (
          <Checkbox onToggle={onToggleAll} checked={isAnySelected} />
        )}
      </th>
      <th className="col-card-content">
        Content
        <span className="deck-count">
          <DeckStats cards={cards} selected={selected} />
        </span>
      </th>
      <th className="col-card-tags">Tags</th>
      <FilteredHeader field="views" onClickField={onClickField} reversed>
        Views
      </FilteredHeader>
      <FilteredHeader field="plays" onClickField={onClickField} reversed>
        Plays
      </FilteredHeader>
      <FilteredHeader field="likes" onClickField={onClickField} reversed>
        Likes/Votes
      </FilteredHeader>
      <FilteredHeader field="wins" onClickField={onClickField} reversed>
        Wins
      </FilteredHeader>
      <FilteredHeader field="discards" onClickField={onClickField} reversed>
        Discards
      </FilteredHeader>
      <FilteredHeader field="rating" onClickField={onClickField}>
        Rating
      </FilteredHeader>
      <FilteredHeader field="tier" onClickField={onClickField}>
        Tier
      </FilteredHeader>
      <FilteredHeader field="rank" onClickField={onClickField} reversed>
        Rank
      </FilteredHeader>
    </tr>
  );
}

interface HeaderProps {
  children: ReactNode;
  field: CardSortField;
  reversed?: boolean;
  onClickField?: (field: CardSortField, reverse?: boolean) => void;
}

function FilteredHeader({
  children,
  field,
  reversed,
  onClickField,
}: HeaderProps) {
  const [selected, setSelected] = useState(false);
  const classes = ['col-card-counter clickable'];
  if (selected) classes.push('selected');
  function handleClick() {
    setSelected(!selected);
    onClickField && onClickField(field, reversed ?? false);
  }
  return (
    <th className={classes.join(' ')} onClick={handleClick}>
      {children}
    </th>
  );
}

export function DeckStats({ cards, selected }: Props) {
  const promptCount = cards.prompts.length;
  const resCount = cards.responses.length;
  const promptSelCount = selected?.prompts.length;
  const resSelCount = selected?.responses.length;
  const isAnySelected = selected && selected.size > 0;
  const { width: screenWidth } = useScreenSize();
  if (isAnySelected) {
    return screenWidth < 1200 ? (
      `Sel: ${selected.size}/${cards.size}`
    ) : (
      <>
        Selected:{' '}
        <Count>
          {promptSelCount}/{promptCount}
        </Count>{' '}
        prompts
        <Separator />
        <Count>
          {resSelCount}/{resCount}
        </Count>{' '}
        responses
      </>
    );
  } else {
    if (screenWidth > 800) {
      return (
        <>
          <Count>{promptCount}</Count> prompts
          <Separator />
          <Count>{resCount}</Count> responses
        </>
      );
    } else {
      return (
        <>
          <Count>{promptCount}</Count> P
          <Separator />
          <Count>{resCount}</Count> R
        </>
      );
    }
  }
}

function Count({ children }: { children: ReactNode }) {
  return <span className="number">{children}</span>;
}

function Separator() {
  return <span style={{ margin: '0 0.5em' }}>|</span>;
}
