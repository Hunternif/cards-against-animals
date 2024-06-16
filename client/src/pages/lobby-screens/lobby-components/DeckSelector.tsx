import { useContext, useEffect, useRef, useState } from "react";
import { addDeck, removeDeck } from "../../../api/lobby-control-api";
import { GameLobby } from "../../../shared/types";
import { Checkbox } from "../../../components/Checkbox";
import { ErrorContext } from "../../../components/ErrorContext";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { useDIContext } from "../../../di-context";
import { DeckWithCount } from "../../../api/deck-repository";
import { useEffectOnce } from "../../../hooks/ui-hooks";

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
      <Checkbox checked={selected} disabled={readOnly} />
    </td>
    <td style={{ width: "50%" }}>
      <div className={`deck-row-title${selectedClass}`}>{deck.title}</div>
    </td>
    <td>
      <div className="count-column deck-prompt-count">{deck.promptCount}</div>
    </td>
    <td>
      <div className="count-column deck-response-count">{deck.responseCount}</div>
    </td>
  </tr>;
}

// const dummyDecks = Array<DeckWithCount>(20)
//   .fill({ id: "dummy", title: "Dummy Deck", promptCount: 10, responseCount: 20 }, 0, 20);

interface SelectorProps {
  lobby: GameLobby,
  readOnly?: boolean,
}

/** Component for selecting decks in the lobby. */
export function DeckSelector({ lobby, readOnly }: SelectorProps) {
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<Array<DeckWithCount>>([]);
  const { setError } = useContext(ErrorContext);
  const { deckRepository } = useDIContext();

  async function loadDecks() {
    await deckRepository.getDecksWithCount().then((d) => {
      setDecks(d);
      setLoading(false);
    }).catch((e: any) => {
      setError(e);
      setLoading(false);
    });
  }

  useEffectOnce(() => { loadDecks(); });

  return (
    <div className="deck-selector">
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
    <table style={{ width: "100%" }}>
      <thead>
        <tr>
          <th></th>
          <th>Deck</th>
          <th><div className="count-column">Prompts</div></th>
          <th><div className="count-column">Responses</div></th>
        </tr>
      </thead>
      <tbody>
        {decks?.map((deck) =>
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
      </tbody>
      <tfoot>
        <tr className="deck-totals-row">
          <td />
          <td className="deck-total-label"></td>
          <td className="deck-total-value">
            <div className="count-column">{promptCount}</div>
          </td>
          <td className="deck-total-value">
            <div className="count-column">{responseCount}</div>
          </td>
        </tr>
      </tfoot>
    </table>
  </>;
}