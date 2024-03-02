
import { useCollection } from "react-firebase-hooks/firestore";
import { Accordion, AccordionItem } from "../../components/Accordion";
import { decksRef } from "../../firebase";
import { AdminDeck } from "./admin-components/AdminDeck";
import { AdminSubpage } from "./admin-components/AdminSubpage";

export function DecksAdmin() {
  const [decks] = useCollection(decksRef);

  return <AdminSubpage title="Decks">
    <Accordion>
      {decks && decks.docs.map((doc) => {
        const deck = doc.data();
        return <AccordionItem key={doc.id} header={deck.title}>
          <AdminDeck deck={deck} />
        </AccordionItem>;
      })}
    </Accordion>
  </AdminSubpage>;
}