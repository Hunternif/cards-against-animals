import { User } from 'firebase/auth';
import { useContext, useEffect, useRef, useState } from 'react';
import { DeckWithCount } from '../../../api/deck/deck-repository';
import { addDeck, removeDeck } from '../../../api/lobby/lobby-control-api';
import { useUserDecksWithKeys } from '../../../api/users-hooks';
import { Checkbox } from '../../../components/Checkbox';
import { ErrorContext } from '../../../components/ErrorContext';
import { IconLock, IconLockOpen } from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useDIContext } from '../../../di-context';
import { useEffectOnce } from '../../../hooks/ui-hooks';
import { GameLobby } from '../../../shared/types';

interface DeckProps {
  deck: DeckWithCount;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  readOnly?: boolean;
  userHasKey?: boolean;
}

function DeckRow({
  deck,
  selected,
  onToggle,
  readOnly,
  userHasKey,
}: DeckProps) {
  const classes = ['deck-row'];
  classes.push(selected ? 'selected' : 'unselected');
  classes.push(readOnly ? 'readonly' : 'editable');
  const isLocked = deck.visibility === 'locked';
  if (isLocked) classes.push('locked');

  function handleClick() {
    if (!readOnly && onToggle) onToggle(!selected);
  }

  return (
    <tr className={classes.join(' ')} onClick={handleClick}>
      <td style={{ width: '2em' }}>
        <Checkbox checked={selected} disabled={readOnly} />
      </td>
      <td style={{ width: '50%' }}>
        <div className="deck-row-title">
          {isLocked &&
            (userHasKey ? (
              <IconLockOpen className="icon-lock" />
            ) : (
              <IconLock className="icon-lock" />
            ))}
          {deck.title}
        </div>
      </td>
      <td>
        <div className="count-column deck-prompt-count">{deck.promptCount}</div>
      </td>
      <td>
        <div className="count-column deck-response-count">
          {deck.responseCount}
        </div>
      </td>
    </tr>
  );
}

// const dummyDecks = Array<DeckWithCount>(20)
//   .fill({ id: "dummy", title: "Dummy Deck", promptCount: 10, responseCount: 20 }, 0, 20);

interface SelectorProps {
  user: User;
  lobby: GameLobby;
  readOnly?: boolean;
}

/** Component for selecting decks in the lobby. */
export function DeckSelector(props: SelectorProps) {
  const { user } = props;
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<Array<DeckWithCount>>([]);
  const { setError } = useContext(ErrorContext);
  const { deckRepository } = useDIContext();
  const [decksWithKeys, _, keysError] = useUserDecksWithKeys(user.uid);

  if (keysError) {
    setError(keysError);
  }

  async function loadDecks() {
    try {
      setDecks(await deckRepository.getDecksWithCount(['public', 'locked']));
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffectOnce(() => {
    loadDecks();
  });

  return (
    <div className="deck-selector">
      {loading ? (
        <LoadingSpinner delay text="Loading decks..." />
      ) : (
        <Decks decks={decks} decksWithKeys={decksWithKeys ?? []} {...props} />
      )}
    </div>
  );
}

interface DecksProps extends SelectorProps {
  /** Deck IDs for which the user has keys */
  decksWithKeys: Array<string>;
  decks: Array<DeckWithCount>;
}

function Decks({ decksWithKeys, lobby, decks, readOnly }: DecksProps) {
  const selectedRef = useRef<Array<DeckWithCount>>(
    decks.filter((d) => lobby.deck_ids.has(d.id)),
  );
  const [promptCount, setPromptCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const decksWithKeysSet = new Set(decksWithKeys);

  function updateCounts() {
    const selection = selectedRef.current;
    setPromptCount(
      selection.reduce((count, deck) => count + deck.promptCount, 0),
    );
    setResponseCount(
      selection.reduce((count, deck) => count + deck.responseCount, 0),
    );
  }

  /** Selects the deck. If it's locked, asks for the password. */
  async function trySelectDeck(deck: DeckWithCount) {
    // TODO: check password
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

  return (
    <>
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th></th>
            <th>Deck</th>
            <th>
              <div className="count-column">Prompts</div>
            </th>
            <th>
              <div className="count-column">Responses</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {decks?.map((deck) => (
            <DeckRow
              key={deck.id}
              deck={deck}
              selected={lobby.deck_ids.has(deck.id)}
              onToggle={(selected) => {
                if (selected) trySelectDeck(deck);
                else deselectDeck(deck);
              }}
              readOnly={readOnly}
              userHasKey={decksWithKeysSet.has(deck.id)}
            />
          ))}
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
    </>
  );
}
