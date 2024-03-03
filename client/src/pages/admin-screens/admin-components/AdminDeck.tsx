import { useContext, useState } from "react";
import { ErrorContext } from "../../../components/ErrorContext";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useEffectOnce } from "../../../components/utils";
import { loadDeck } from "../../../model/deck-api";
import { Deck } from "../../../shared/types";

interface Props {
  deckID: string,
}

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deckID }: Props) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const { setError } = useContext(ErrorContext);
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
          <tr key={card.id} className="row-prompt">
            <td className="col-card-id">{card.id}</td>
            <td className="col-card-content">
              <span className="content">{card.content}</span>
              <div className="prompt-pick-number">{card.pick}</div>
            </td>
            <td className="col-card-tags">{card.tags.join(", ")}</td>
          </tr>
        ))}
        {deck.responses.map((card) => (
          <tr key={card.id} className="row-response">
            <td className="col-card-id">{card.id}</td>
            <td className="col-card-content">{card.content}</td>
            <td className="col-card-tags">{card.tags.join(", ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>;
}