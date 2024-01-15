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
  readOnly?: boolean,
}

function DeckRow({ deck, selected, onToggle, readOnly }: DeckProps) {
  const selectedClass = selected ? " selected" : " unselected";
  const readOnlyClass = readOnly ? " readonly" : " editable";
  function handleClick() {
    if (!readOnly && onToggle) onToggle(!selected);
  }
  return <tr
    className={`deck-row${selectedClass}${readOnlyClass}`}
    onClick={handleClick}>
    <td style={{ width: "2em" }}>
      <Checkbox checked={selected} onChange={handleClick} disabled={readOnly} />
    </td>
    <td style={{ width: "50%" }}>
      <span className={`deck-row-title${selectedClass}`}>{deck.title}</span>
    </td>
    <td>
      <span className="deck-prompt-count">{deck.promptCount}</span>
    </td>
    <td>
      <span className="deck-response-count">{deck.responseCount}</span>
    </td>
  </tr>;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
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
  readOnly?: boolean,
}

export function DeckSelector({ lobby, readOnly }: SelectorProps) {
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
        <Decks lobby={lobby} decks={decks} readOnly={readOnly} />}
    </div>
  );
}

interface DecksProps {
  lobby: GameLobby,
  decks: Array<DeckWithCount>,
  readOnly?: boolean,
}

function Decks({ lobby, decks, readOnly }: DecksProps) {
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

  // Update counts once after page load:
  useEffect(() => updateCounts(), [lobby.id]);

  return <>
    <div style={scrollableColumnStyle}
      className="miniscrollbar miniscrollbar-auto miniscrollbar-light deck-selector">
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th></th>
            <th>Deck</th>
            <th>Prompts</th>
            <th>Responses</th>
          </tr>
        </thead>
        <tbody>
          {decks?.map((deck, i) =>
            <DeckRow
              key={deck.id}
              deck={deck}
              selected={lobby.deck_ids.has(deck.id)}
              onToggle={(selected) => {
                if (selected) selectDeck(deck);
                else deselectDeck(deck);
              }}
              readOnly={readOnly}
            />
          )}
          <tr className="deck-totals-row">
            <td/>
            <td className="deck-total-label"></td>
            <td className="deck-total-value">{promptCount}</td>
            <td className="deck-total-value">{responseCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </>;
}