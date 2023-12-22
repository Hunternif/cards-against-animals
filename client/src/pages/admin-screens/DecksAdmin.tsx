
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { decksRef } from "../../firebase";
import { Deck } from "../../shared/types";
import { collection } from "firebase/firestore";
import { promptDeckCardConverter, responseDeckCardConverter } from "../../shared/firestore-converters";
import { Accordion } from "react-bootstrap";

export function DecksAdmin() {
  const [decks] = useCollection(decksRef);

  return <div className="data-section">
    <h2>Decks</h2>
    <Accordion>
      {decks && decks.docs.map((doc) => {
        const deck = doc.data();
        return <Accordion.Item key={doc.id} eventKey={doc.id}>
          <Accordion.Header>{deck.title}</Accordion.Header>
          <Accordion.Body>
            <ul>
              <PromptsData deck={deck} />
              <ResponseData deck={deck} />
            </ul>
          </Accordion.Body>
        </Accordion.Item>
      })}
    </Accordion>
  </div>;
}

interface DeckProps {
  deck: Deck;
}

function PromptsData({ deck }: DeckProps) {
  const [prompts] = useCollectionData(
    collection(decksRef, deck.id, 'prompts')
      .withConverter(promptDeckCardConverter)
  );
  return <div className="data-subsection">
    <h5>Prompts:</h5>
    <ul>
      {prompts && prompts.map((card, i) =>
        <li key={i}>{card.content} ({card.rating})</li>
      )}
    </ul>
  </div>
}

function ResponseData({ deck }: DeckProps) {
  const [responses] = useCollectionData(
    collection(decksRef, deck.id, 'responses')
      .withConverter(responseDeckCardConverter)
  );
  return <div className="data-subsection">
    <h5>Responses:</h5>
    <ul>
      {responses && responses.map((card, i) =>
        <li key={i}>{card.content} ({card.rating})</li>
      )}
    </ul>
  </div>
}