
import { collection } from "firebase/firestore";
import { useCollection, useCollectionData } from "react-firebase-hooks/firestore";
import { Accordion, AccordionItem } from "../../components/Accordion";
import { decksRef } from "../../firebase";
import { promptDeckCardConverter, responseDeckCardConverter } from "../../shared/firestore-converters";
import { Deck } from "../../shared/types";
import { AdminSubpage } from "./admin-components/AdminSubpage";

export function DecksAdmin() {
  const [decks] = useCollection(decksRef);

  return <AdminSubpage title="Decks">
    <Accordion>
      {decks && decks.docs.map((doc) => {
        const deck = doc.data();
        return <AccordionItem key={doc.id} header={deck.title}>
          <ul>
            <PromptsData deck={deck} />
            <ResponseData deck={deck} />
          </ul>
        </AccordionItem>;
      })}
    </Accordion>
  </AdminSubpage>;
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