import { CSSProperties } from "react";
import { Deck } from "../shared/types";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";

interface DeckProps {
  deck: Deck,
}

function DeckBox({ deck }: DeckProps) {
  return <div className="deck-box">
    <h4>{deck.title}</h4>
  </div>;
}

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingLeft: "2em",
  paddingRight: "calc(2em - 8px)",
  display: "flex",
  flexWrap: "wrap",
  gap: "2em",
};

const dummyDecks = Array<Deck>(20)
  .fill(new Deck("dummy", "Dummy Deck"), 0, 20);

export function DeckSelector() {
  // const [decks, loading] = useCollectionDataOnce(decksRef);
  const [decks, loading] = [dummyDecks, false];
  if (loading) return <LoadingSpinner text="Loading decks..." />;
  return (
    <FillLayout style={scrollableColumnStyle}
      className="miniscrollbar miniscrollbar-dark deck-selector">
      {decks?.map((deck, i) => <div key={i} style={{
        flexGrow: 1,
        display: "flex",
        placeContent: "center"
      }}>
        <DeckBox deck={deck} />
      </div>)}
    </FillLayout>
  );
}