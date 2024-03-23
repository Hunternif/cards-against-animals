import { FormEvent, useContext, useState } from "react";
import { InlineButton } from "../../../components/Buttons";
import { ErrorContext } from "../../../components/ErrorContext";
import { IconUndo } from "../../../components/Icons";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useEffectOnce } from "../../../components/utils";
import { loadDeck } from "../../../model/deck-api";
import { Deck, DeckCard, PromptDeckCard } from "../../../shared/types";
import { CardContent } from "../../lobby-screens/game-components/LargeCard";

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
    return editedCards.findIndex((c) =>
      c.id === card.id && c.type === card.type) > -1;
  }
  function startEditCard(card: DeckCard) {
    if (!isEdited(card)) {
      const editListCopy = editedCards.slice();
      editListCopy.push(card);
      setEditedCards(editListCopy);
    }
  }
  function cancelEditCard(card: DeckCard) {
    const idx = editedCards.findIndex((c) =>
      c.id === card.id && c.type === card.type);
    if (idx > -1) {
      const editListCopy = editedCards.slice();
      editListCopy.splice(idx, 1);
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

  // TODO: use react-virtualized to speed up rendering of a large table
  return <>
    <table className="admin-deck">
      <tbody>
        {deck.prompts.map((card) => (
          <CardRow key={card.id} card={card}
            edited={isEdited(card)}
            onClick={() => startEditCard(card)}
            onCancel={() => cancelEditCard(card)}
          />
        ))}
        {deck.responses.map((card) => (
          <CardRow key={card.id} card={card}
            edited={isEdited(card)}
            onClick={() => startEditCard(card)}
            onCancel={() => cancelEditCard(card)}
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
  onCancel?: () => void,
}

function CardRow({ card, edited, onClick, onCancel }: RowProps) {
  const editableClass = edited ? "edited" : "editable";
  const isPrompt = card instanceof PromptDeckCard;
  const cardClass = isPrompt ? "row-prompt" : "row-response";

  const [content, setContent] = useState(card.content);

  function handleContentInput(event: FormEvent<HTMLElement>) {
    event.preventDefault();
    setContent(event.currentTarget.innerText);
    console.log(`Content: ${event.currentTarget.innerText}`);
  }

  function handleCancel() {
    setContent(card.content);
    if (onCancel) onCancel();
  }

  return <tr className={`card-row ${cardClass} ${editableClass}`}
    onClick={onClick}>
    <td className="col-card-id">{card.id}</td>
    <td className="col-card-content">
      {edited ? (
        // See https://stackoverflow.com/a/48309377/1093712
        <CardContent contentEditable
          onBeforeInput={handleContentInput}
        >{content}</CardContent>
      ) : (
        <CardContent>{card.content}</CardContent>
      )}
      {isPrompt && <div className="prompt-pick-number">{card.pick}</div>}
    </td>
    <td className="col-card-tags">{card.tags.join(", ")}</td>
    <td className="col-card-controls">
      {edited && <>
        <InlineButton title="Cancel" onClick={handleCancel}><IconUndo /></InlineButton>
      </>}
    </td>
  </tr>
}