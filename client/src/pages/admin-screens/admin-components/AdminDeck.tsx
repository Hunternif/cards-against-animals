import { CSSProperties, ReactNode, useContext, useState } from 'react';
import { GameButton } from '../../../components/Buttons';
import { ErrorContext } from '../../../components/ErrorContext';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Twemoji } from '../../../components/Twemoji';
import { VirtualTable } from '../../../components/VirtualTable';
import { useDIContext } from '../../../di-context';
import { useEffectOnce } from '../../../hooks/ui-hooks';
import { isOnlyEmojis } from '../../../api/deck-parser';
import { Deck, DeckCard, PromptDeckCard } from '../../../shared/types';
import { AdminDeckControlRow } from './AdminDeckControlRow';

interface Props {
  deckID: string;
}

/**
 * Prompts and responses can have the same ID.
 * This function returns a prefixed ID that is unique in a list containing
 * both prompts and responses.
 */
function typedID(card: DeckCard): string {
  return card.type + card.id;
}

function combinedCardList(deck: Deck): DeckCard[] {
  const list: DeckCard[] = deck.prompts;
  return list.concat(deck.responses);
}

const rowHeight = 22;
const borderWidth = 2;
const rowStyle: CSSProperties = {
  height: rowHeight,
};

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deckID }: Props) {
  const { deckRepository } = useDIContext();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [list, setList] = useState<DeckCard[]>([]);
  const { setError } = useContext(ErrorContext);
  // Maps card 'typed id' to card
  const [selectedCards, setSelectedCards] = useState<Map<string, DeckCard>>(
    new Map(),
  );

  function isSelected(card: DeckCard): boolean {
    return selectedCards.has(typedID(card));
  }
  function toggleSelectedCard(card: DeckCard) {
    const id = typedID(card);
    const copy = new Map(selectedCards.entries());
    if (selectedCards.has(id)) copy.delete(id);
    else copy.set(id, card);
    setSelectedCards(copy);
  }
  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedCards(new Map(list.map((c) => [typedID(c), c])));
    } else {
      setSelectedCards(new Map());
    }
  }

  // Load decks
  useEffectOnce(() => {
    if (!deck) {
      deckRepository
        .downloadDeck(deckID)
        .then((val) => {
          setDeck(val);
          setList(combinedCardList(val));
        })
        .catch((e) => setError(e));
    }
  });
  if (!deck) return <LoadingSpinner />;

  return (
    <>
      <AdminDeckControlRow
        deck={deck}
        selected={Array.from(selectedCards.values())}
        onToggleAll={toggleSelectAll}
      />
      <VirtualTable
        className="admin-deck-table"
        rowHeight={rowHeight + borderWidth}
        data={list}
        render={(card) => (
          <CardRow
            card={card}
            selected={isSelected(card)}
            onClick={() => toggleSelectedCard(card)}
          />
        )}
      />
    </>
  );
}

interface RowProps {
  card: DeckCard;
  selected?: boolean;
  onClick?: () => void;
}

function CardRow({ card, selected, onClick }: RowProps) {
  const selectedClass = selected ? 'selected' : 'selectable';
  const isPrompt = card instanceof PromptDeckCard;
  const cardClass = isPrompt ? 'row-prompt' : 'row-response';
  return (
    <tr className={`card-row ${cardClass} ${selectedClass}`} onClick={onClick}>
      <td className="col-card-id" style={rowStyle}>
        {card.id}
      </td>
      <td className="col-card-content" style={rowStyle}>
        <CardContentRow>{card.content}</CardContentRow>
        <EditButton />
        {isPrompt && <div className="prompt-pick-number">{card.pick}</div>}
      </td>
      <td className="col-card-tags" style={rowStyle}>
        {card.tags.join(', ')}
      </td>
    </tr>
  );
}

interface CardContentRowProps {
  children: ReactNode;
}
function CardContentRow(props: CardContentRowProps) {
  const content = props.children?.toString() ?? '';
  const emojiClass = isOnlyEmojis(content) ? 'emoji-only ' : '';
  return (
    <Twemoji {...props} className={`card-content-admin-row ${emojiClass}`} />
  );
}

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="edit-button-container">
      <GameButton
        tiny
        className="edit-button"
        onClick={(e) => {
          e.stopPropagation(); // prevent selecting the row
          if (onClick) onClick();
        }}
      >
        Edit
      </GameButton>
    </div>
  );
}
