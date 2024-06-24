import { ReactNode } from 'react';
import { GameButton } from '../../../components/Buttons';
import { Checkbox } from '../../../components/Checkbox';
import { useScreenSize } from '../../../components/layout/ScreenSizeSwitch';
import { DeckCard } from '../../../shared/types';

interface Props {
  cards: DeckCard[];
  onToggleAll?: (checked: boolean) => void;
  onClickCopy?: () => void;
  selected?: DeckCard[];
  readOnly?: boolean;
}

/**
 * Advanced header with extra controls on each column
 */
export function AdminDeckControlRow({
  cards,
  onToggleAll,
  onClickCopy,
  selected,
  readOnly,
}: Props) {
  const isAnySelected = selected && selected.length > 0;

  return (
    <table className="admin-deck-table admin-deck-control-row">
      <tbody>
        <tr>
          <td className="col-card-id">
            {readOnly ? (
              'ID'
            ) : (
              <Checkbox onToggle={onToggleAll} checked={isAnySelected} />
            )}
          </td>
          <td className="col-card-content">
            Content
            <span className="deck-count">
              <DeckStats cards={cards} selected={selected} />
            </span>
            {isAnySelected && (
              <GameButton inline tiny light onClick={onClickCopy}>
                Copy to...
              </GameButton>
            )}
          </td>
          <td className="col-card-tags">Tags</td>
          <td className="col-card-counter">Views</td>
          <td className="col-card-counter">Plays</td>
          <td className="col-card-counter">Wins</td>
          <td className="col-card-counter">Discards</td>
          <td className="col-card-counter">Rating</td>
        </tr>
      </tbody>
    </table>
  );
}

function DeckStats({ cards, selected }: Props) {
  const promptCount = cards.filter((c) => c.type === 'prompt').length;
  const resCount = cards.filter((c) => c.type === 'response').length;
  const promptSelCount = selected?.filter((c) => c.type === 'prompt').length;
  const resSelCount = selected?.filter((c) => c.type === 'response').length;
  const isAnySelected = selected && selected.length > 0;
  const { width: screenWidth } = useScreenSize();
  if (isAnySelected) {
    return screenWidth < 1200 ? (
      `Sel: ${selected.length}/${cards.length}`
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
