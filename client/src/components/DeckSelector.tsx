import { CSSProperties, useContext, useEffect, useRef, useState } from "react";
import { DeckWithCount, getDecksWithCount } from "../model/deck-api";
import { addDeck, removeDeck } from "../model/lobby-api";
import { GameLobby } from "../shared/types";
import { ErrorContext } from "./ErrorContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { Checkbox } from "./Checkbox";

interface DeckProps {
  deck: DeckWithCount,
  selected?: boolean,
  onToggle?: (selected: boolean) => void,
}

const deckRowStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  gap: "0.75em",
  paddingLeft: "0.75em",
  paddingRight: "0.75em",
}

function DeckRow({ deck, selected, onToggle }: DeckProps) {
  const selectedClass = selected ? " selected" : " unselected";
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div
    className={`deck-row${selectedClass}`}
    style={deckRowStyle}
    onClick={handleClick}>
    <Checkbox checked={selected} onChange={handleClick}/>
    <span className={`deck-row-title${selectedClass}`}>{deck.title}</span>
  </div>;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "16rem",
}

const scrollableColumnStyle: CSSProperties = {
  overflowY: "auto",
  marginTop: "1em",
  marginBottom: "1em",
};

// const dummyDecks = Array<DeckWithCount>(20)
//   .fill({ id: "dummy", title: "Dummy Deck", promptCount: 10, responseCount: 20 }, 0, 20);

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
  const selectedRef = useRef<Array<DeckWithCount>>(
    decks.filter((d) => lobby.deck_ids.has(d.id)));
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
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light deck-selector">
      {decks?.map((deck, i) =>
        <DeckRow
          key={deck.id}
          deck={deck}
          selected={lobby.deck_ids.has(deck.id)}
          onToggle={(selected) => {
            if (selected) selectDeck(deck);
            else deselectDeck(deck);
          }} />
      )}
    </div>
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