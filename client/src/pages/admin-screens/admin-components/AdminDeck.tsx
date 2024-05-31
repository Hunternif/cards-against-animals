import { ReactNode, useContext, useState } from "react";
import { ErrorContext } from "../../../components/ErrorContext";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { Twemoji } from "../../../components/Twemoji";
import { useEffectOnce } from "../../../components/utils";
import { isOnlyEmojis, loadDeck } from "../../../model/deck-api";
import { Deck, DeckCard, PromptDeckCard } from "../../../shared/types";

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

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deckID }: Props) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const { setError } = useContext(ErrorContext);
  // Maps card id to card
  const [selectedCards, setSelectedCards] = useState<Map<string, DeckCard>>(
    new Map()
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

  // Load decks
  useEffectOnce(() => {
    if (!deck) {
      loadDeck(deckID)
        .then((val) => setDeck(val))
        .catch((e) => setError(e));
    }
  });
  if (!deck) return <LoadingSpinner />;

  // TODO: use react-virtualized to speed up rendering of a large table
  return (
    <>
      <table className="admin-deck">
        <tbody>
          {deck.prompts.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              selected={isSelected(card)}
              onClick={() => toggleSelectedCard(card)}
            />
          ))}
          {deck.responses.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              selected={isSelected(card)}
              onClick={() => toggleSelectedCard(card)}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}

interface RowProps {
  card: DeckCard;
  selected?: boolean;
  onClick?: () => void;
}

function CardRow({ card, selected, onClick }: RowProps) {
  const selectedClass = selected ? "selected" : "selectable";
  const isPrompt = card instanceof PromptDeckCard;
  const cardClass = isPrompt ? "row-prompt" : "row-response";
  return (
    <tr className={`card-row ${cardClass} ${selectedClass}`} onClick={onClick}>
      <td className="col-card-id">{card.id}</td>
      <td className="col-card-content">
        <CardContentRow>{card.content}</CardContentRow>
        {isPrompt && <div className="prompt-pick-number">{card.pick}</div>}
      </td>
      <td className="col-card-tags">{card.tags.join(", ")}</td>
    </tr>
  );
}

interface CardContentRowProps {
  children: ReactNode;
}
function CardContentRow(props: CardContentRowProps) {
  const content = props.children?.toString() ?? "";
  const emojiClass = isOnlyEmojis(content) ? "emoji-only " : "";
  return (
    <Twemoji {...props} className={`card-content-admin-row ${emojiClass}`} />
  );
}
