import { useContext, useState } from "react";
import { ErrorContext } from "../../../components/ErrorContext";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useEffectOnce } from "../../../components/utils";
import { loadDeck } from "../../../model/deck-api";
import { Deck, DeckCard, PromptDeckCard } from "../../../shared/types";

interface Props {
  deckID: string,
}

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deckID }: Props) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const { setError } = useContext(ErrorContext);
  const [editedCards, setEditedCards] = useState<DeckCard[]>([]);

  function isEdited(card: DeckCard): boolean {
    return editedCards.findIndex((c) => c.id === card.id) > -1;
  }
  function startEditCard(card: DeckCard) {
    if (!isEdited(card)) {
      const editListCopy = editedCards.slice();
      editListCopy.push(card);
      setEditedCards(editListCopy);
    }
  }

  // Load decks
  useEffectOnce(() => {
    if (!deck) {
      loadDeck(deckID).then((val) => setDeck(val))
        .catch((e) => setError(e));
    }
  });
  if (!deck) return <LoadingSpinner />;

  return <>
    <table className="admin-deck">
      <tbody>
        {deck.prompts.map((card) => (
          <CardRow key={card.id} card={card}
            edited={isEdited(card)}
            onClick={() => startEditCard(card)}
          />
        ))}
        {deck.responses.map((card) => (
          <CardRow key={card.id} card={card}
            edited={isEdited(card)}
            onClick={() => startEditCard(card)}
          />
        ))}
      </tbody>
    </table>
  </>;
}

interface RowProps {
  card: DeckCard,
  edited?: boolean,
  onClick?: () => void,
}

function CardRow({ card, edited, onClick }: RowProps) {
  const editableClass = edited ? "edited" : "editable";
  const isPrompt = card instanceof PromptDeckCard;
  const cardClass = isPrompt ? "row-prompt" : "row-response";
  return <tr className={`card-row ${cardClass} ${editableClass}`}
    onClick={onClick}>
    <td className="col-card-id">{card.id}</td>
    <td className="col-card-content">
      <span className="content">{card.content}</span>
      {isPrompt && <div className="prompt-pick-number">{card.pick}</div>}
    </td>
    <td className="col-card-tags">{card.tags.join(", ")}</td>
  </tr>
}