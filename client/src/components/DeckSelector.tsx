import { CSSProperties } from "react";
import { Deck } from "../shared/types";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";

interface DeckProps {
  deck: Deck,
}

function DeckBox({ deck }: DeckProps) {
  return <div style={{
    width: "10em",
    height: "14em",
    borderRadius: "2px",
    padding: "0.5em",
  }}>
    <h2>{deck.title}</h2>
  </div>;
}

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingLeft: "1em",
  paddingRight: "calc(1em - 8px)",
};

const dummyDecks = Array<Deck>(20)
  .fill(new Deck("dummy", "Dummy Deck"), 0, 20);

export function DeckSelector() {
  // const [decks, loading] = useCollectionDataOnce(decksRef);
  const [decks, loading] = [dummyDecks, false];
  if (loading) return <LoadingSpinner text="Loading decks..." />;
  return (
    <FillLayout style={{
      display: "flex",
      flexWrap: "wrap",
      ...scrollableColumnStyle
    }}
    className="miniscrollbar"
    >
      {decks?.map((deck, i) => <div key={i} style={{
        flexGrow: 1,
      }}>
        <DeckBox deck={deck} />
      </div>)}
    </FillLayout>
  );
}