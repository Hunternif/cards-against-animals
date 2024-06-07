import { useCollectionDataOnce } from "react-firebase-hooks/firestore";
import { Accordion, AccordionItem } from "../../components/Accordion";
import { GameButton } from "../../components/Buttons";
import { decksRef } from "../../firebase";
import { AdminDeck } from "./admin-components/AdminDeck";
import { AdminSubpage } from "./admin-components/AdminSubpage";

export function DecksAdmin() {
  const [decks] = useCollectionDataOnce(decksRef);

  return (
    <AdminSubpage headerContent={<Toolbar />}>
      <Accordion>
        {decks &&
          decks.map((deck) => {
            return (
              <AccordionItem
                key={deck.id}
                header={
                  <div className="deck-header">
                    <span className="deck-title">{deck.title}</span>
                    <span className="deck-id">id: {deck.id}</span>
                  </div>
                }
              >
                <AdminDeck deckID={deck.id} />
              </AccordionItem>
            );
          })}
      </Accordion>
    </AdminSubpage>
  );
}

function Toolbar() {
  return (
    <div className="admin-decks-toolbar">
      <h2>Decks</h2>
      <GameButton light small>
        Export decks
      </GameButton>
    </div>
  );
}
