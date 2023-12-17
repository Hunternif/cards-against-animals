import { CSSProperties, useContext, useEffect, useRef, useState } from "react";
import { DeckWithCount, getDecksWithCount } from "../model/deck-api";
import { addDeck, removeDeck } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { ErrorContext } from "./ErrorContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface DeckProps {
  deck: DeckWithCount,
  selected?: boolean,
  onToggle?: (selected: boolean) => void,
}

function DeckBox({ deck, selected, onToggle }: DeckProps) {
  const className = `deck-box hoverable-card ${selected ? "selected" : ""}`;
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div className={className} onClick={handleClick}>
    <h4>{deck.title}</h4>
  </div>;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "16rem",
}

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  paddingTop: "1em",
  paddingBottom: "1.5em",
  paddingLeft: "2em",
  paddingRight: "calc(2em - 8px)",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignContent: "flex-start",
  gap: "2em",
};

const hrStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "1em",
  marginLeft: "1em",
  marginRight: "1em",
}

// const dummyDecks = Array<Deck>(20)
//   .fill(new Deck("dummy", "Dummy Deck"), 0, 20);

interface SelectorProps {
  lobby: GameLobby,
}

export function DeckSelector({ lobby }: SelectorProps) {
  // const [decks, loading] = [dummyDecks, false]; // for testing UI
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<Array<DeckWithCount>>([]);
  const { setError } = useContext(ErrorContext);

  async function loadDecks() {
    await getDecksWithCount().then((d) => {
      setDecks(d);
      setLoading(false);
    }).catch((e) => {
      setError(e);
      setLoading(false);
    });
  }

  useEffect(() => { loadDecks(); }, []);

  return (
    <div style={containerStyle}>
      {loading ? <LoadingSpinner delay text="Loading decks..." /> :
        <Decks lobby={lobby} decks={decks} />}
    </div>
  );
}

interface DecksProps {
  lobby: GameLobby,
  decks: Array<DeckWithCount>,
}

function Decks({ lobby, decks }: DecksProps) {
  const selectedRef = useRef<Array<DeckWithCount>>([]);
  const [promptCount, setPromptCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);

  function updateCounts() {
    const selection = selectedRef.current;
    setPromptCount(selection.reduce((count, deck) => count + deck.promptCount, 0));
    setResponseCount(selection.reduce((count, deck) => count + deck.responseCount, 0));
  }

  async function selectDeck(deck: DeckWithCount) {
    const selection = selectedRef.current;
    selection.push(deck);
    updateCounts();
    await addDeck(lobby, deck.id);
  }

  async function deselectDeck(deck: DeckWithCount) {
    const selection = selectedRef.current;
    const index = selection.findIndex((d) => d.id === deck.id);
    if (index > -1) {
      selection.splice(index, 1);
      updateCounts();
      await removeDeck(lobby, deck.id);
    }
  }

  return <>
    <div style={scrollableColumnStyle}
      className="miniscrollbar miniscrollbar-dark deck-selector">
      {decks?.map((deck, i) => <div key={i} style={{
        display: "flex",
        placeContent: "center"
      }}>
        <DeckBox deck={deck}
          selected={lobby.deck_ids.has(deck.id)}
          onToggle={(selected) => {
            if (selected) selectDeck(deck);
            else deselectDeck(deck);
          }} />
      </div>
      )}
    </div>
    <hr style={hrStyle} />
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "2em",
      marginBottom: "0.5em",
    }}>
      <span>
        <span className="stat-label">Prompts: </span>
        <span className="stat-value">{promptCount}</span>
      </span>
      <span>
        <span className="stat-label">Responses: </span>
        <span className="stat-value">{responseCount}</span>
      </span>
    </div>
  </>;
}