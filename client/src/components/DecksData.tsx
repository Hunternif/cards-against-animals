
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { decksRef } from "../firebase";
import { Deck } from "../model/types";
import { collection } from "firebase/firestore";
import { promptDeckCardConverter, responseDeckCardConverter } from "../model/firebase-converters";

export function DecksData() {
  const [decks] = useCollection(decksRef);

  return <p className="data-section">
    <h2>Decks</h2>
    {decks && decks.docs.map((doc) => {
      const deck = doc.data();
      return <div key={doc.id}>
        <h4>Deck "{deck.title}"</h4>
        <ul>
          <PromptsData deck={deck} />
          <ResponseData deck={deck} />
        </ul>
      </div>
    })}
  </p>;
}

interface DeckProps {
  deck: Deck;
}

function PromptsData({ deck }: DeckProps) {
  const [prompts] = useCollectionData(
    collection(decksRef, deck.id, 'prompts')
      .withConverter(promptDeckCardConverter)
  );
  return <p className="data-subsection">
    <h5>Prompts:</h5>
    <ul>
      {prompts && prompts.map((card, i) =>
        <li key={i}>{card.content} ({card.rating})</li>
      )}
    </ul>
  </p>
}

function ResponseData({ deck }: DeckProps) {
  const [responses] = useCollectionData(
    collection(decksRef, deck.id, 'responses')
      .withConverter(responseDeckCardConverter)
  );
  return <p className="data-subsection">
    <h5>Responses:</h5>
    <ul>
      {responses && responses.map((card, i) =>
        <li key={i}>{card.content} ({card.rating})</li>
      )}
    </ul>
  </p>
}