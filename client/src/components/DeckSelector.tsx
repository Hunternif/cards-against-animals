import { CSSProperties } from "react";
import { useCollectionDataOnce } from "react-firebase-hooks/firestore";
import { decksRef } from "../firebase";
import { addDeck, removeDeck } from "../model/lobby-api";
import { Deck, GameLobby } from "../shared/types";
import { FillLayout } from "./layout/FillLayout";
import { LoadingSpinner } from "./utils";

interface DeckProps {
  deck: Deck,
  selected?: boolean,
  onToggle?: (selected: boolean) => void,
}

function DeckBox({ deck, selected, onToggle }: DeckProps) {
  const className = `deck-box ${selected ? "selected" : ""}`;
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div className={className} onClick={handleClick}>
    <h4>{deck.title}</h4>
  </div>;
}

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingTop: "1em",
  paddingBottom: "1em",
  paddingLeft: "2em",
  paddingRight: "calc(2em - 8px)",
  display: "flex",
  flexWrap: "wrap",
  gap: "2em",
};

// const dummyDecks = Array<Deck>(20)
//   .fill(new Deck("dummy", "Dummy Deck"), 0, 20);

interface SelectorProps {
  lobby: GameLobby,
}

export function DeckSelector({ lobby }: SelectorProps) {
  const [decks, loading] = useCollectionDataOnce(decksRef);
  // const [decks, loading] = [dummyDecks, false]; // for testing UI
  if (loading) return <LoadingSpinner text="Loading decks..." />;
  return (
    <FillLayout style={scrollableColumnStyle}
      className="miniscrollbar miniscrollbar-dark deck-selector">
      {decks?.map((deck, i) => <div key={i} style={{
        flexGrow: 1,
        display: "flex",
        placeContent: "center"
      }}>
        <DeckBox deck={deck}
          selected={lobby.deck_ids.has(deck.id)}
          onToggle={(selected) => {
            if (selected) addDeck(lobby, deck.id);
            else removeDeck(lobby, deck.id);
          }} />
      </div>)}
    </FillLayout>
  );
}