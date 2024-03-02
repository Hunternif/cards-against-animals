import { collection } from "firebase/firestore";
import { useCollectionDataOnce } from "react-firebase-hooks/firestore";
import { decksRef } from "../../../firebase";
import { promptDeckCardConverter, responseDeckCardConverter } from "../../../shared/firestore-converters";
import { Deck } from "../../../shared/types";

interface Props {
  deck: Deck,
}

/**
 * Renders all cards in the deck as a table.
 */
export function AdminDeck({ deck }: Props) {
  const [prompts] = useCollectionDataOnce(
    collection(decksRef, deck.id, 'prompts')
      .withConverter(promptDeckCardConverter));
  const [responses] = useCollectionDataOnce(
    collection(decksRef, deck.id, 'responses')
      .withConverter(responseDeckCardConverter));
  return <>
    <table className="admin-deck">
      <tbody>
        {prompts?.map((card) => (
          <tr key={card.id}>
            <td className="col-id">{card.id}</td>
            <td className="col-card-content">{card.content}</td>
            <td className="col-card-pick">{card.pick}</td>
            <td className="col-card-tags">{card.tags.join(", ")}</td>
          </tr>
        ))}
        {responses?.map((card) => (
          <tr key={card.id}>
            <td className="col-id">{card.id}</td>
            <td className="col-card-content">{card.content}</td>
            <td className="col-card-tags">{card.tags.join(", ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>;
}