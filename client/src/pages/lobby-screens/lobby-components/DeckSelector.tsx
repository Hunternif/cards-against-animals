import { User } from 'firebase/auth';
import { useContext, useState } from 'react';
import { DeckWithCount } from '../../../api/deck/deck-repository';
import { addDeck, removeDeck } from '../../../api/lobby/lobby-control-api';
import { useUserDecksWithKeys } from '../../../api/users-hooks';
import { Checkbox } from '../../../components/Checkbox';
import { ErrorContext } from '../../../components/ErrorContext';
import { IconLock, IconLockOpen } from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useDIContext } from '../../../di-context';
import { useMarkedData } from '../../../hooks/data-hooks';
import { useEffectOnce } from '../../../hooks/ui-hooks';
import { GameLobby } from '../../../shared/types';
import { sleep } from '../../../shared/utils';
import { Modal } from '../../../components/Modal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TextInput } from '../../../components/FormControls';

interface DeckProps {
  deck: DeckInfo;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  readOnly?: boolean;
  unlocking?: boolean;
}

function DeckRow({ deck, selected, onToggle, readOnly, unlocking }: DeckProps) {
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
          {isLocked && (
            <span className="icon">
              {unlocking ? (
                <LoadingSpinner inline />
              ) : deck.userHasKey ? (
                <IconLockOpen className="icon-lock" />
              ) : (
                <IconLock className="icon-lock" />
              )}
            </span>
          )}
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
  const { user, lobby } = props;
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<Array<DeckWithCount>>([]);
  const { setError } = useContext(ErrorContext);
  const { deckRepository } = useDIContext();
  const [decksWithKeys, _, keysError] = useUserDecksWithKeys(user.uid);
  const deckInfo: Array<DeckInfo> = decks.map((deck) => {
    return {
      selected: lobby.deck_ids.has(deck.id),
      userHasKey: decksWithKeys.indexOf(deck.id) > -1,
      ...deck,
    };
  });

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
        <Decks decks={deckInfo} {...props} />
      )}
    </div>
  );
}

/** Internal type to store extra info with the deck */
type DeckInfo = DeckWithCount & {
  selected?: boolean;
  userHasKey?: boolean;
};

interface DecksProps extends SelectorProps {
  decks: Array<DeckInfo>;
}

function Decks({ lobby, decks, readOnly }: DecksProps) {
  const { setError } = useContext(ErrorContext);
  const selectedDecks = decks.filter((d) => d.selected);
  const promptCount = selectedDecks.reduce(
    (count, deck) => count + deck.promptCount,
    0,
  );
  const responseCount = selectedDecks.reduce(
    (count, deck) => count + deck.responseCount,
    0,
  );

  /** Decks that are in the process of being unlocked. */
  const [unlockingIDs, startUnlock, endUnlock] = useMarkedData<string>();
  /** Deck for which we are requesting password. */
  const [passwordDeck, setPasswordDeck] = useState<DeckInfo>();

  /** Selects the deck. If it's locked, asks for the password. */
  async function trySelectDeck(deck: DeckInfo) {
    if (deck.visibility === 'locked') {
      try {
        startUnlock(deck.id);
        // TODO: check password
        setPasswordDeck(deck);
        endUnlock(deck.id);
        doSelectDeck(deck);
      } catch (e: any) {
        setError(e);
        endUnlock(deck.id);
      }
    } else {
      doSelectDeck(deck);
    }
  }

  async function doSelectDeck(deck: DeckInfo) {
    await addDeck(lobby, deck.id);
  }

  async function unselectDeck(deck: DeckInfo) {
    await removeDeck(lobby, deck.id);
  }

  async function saveDeckPassword() {
    // TODO: check password and do select.
    setPasswordDeck(undefined);
  }

  return (
    <>
      <DeckPasswordModal
        deck={passwordDeck}
        onCancel={() => setPasswordDeck(undefined)}
        onComplete={saveDeckPassword}
      />
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
              selected={deck.selected}
              onToggle={(selected) => {
                if (selected) trySelectDeck(deck);
                else unselectDeck(deck);
              }}
              readOnly={readOnly}
              unlocking={unlockingIDs.has(deck.id)}
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

type DeckPasswordProps = {
  deck?: DeckInfo;
  onComplete: () => void;
  onCancel: () => void;
};

function DeckPasswordModal({ deck, onComplete, onCancel }: DeckPasswordProps) {
  const [password, setPassword] = useState<string>('');
  async function saveDeckPassword() {
    // TODO: check password and save it.
    onComplete();
  }
  return (
    <ConfirmModal
      className="deck-password-modal"
      show={deck != null}
      onConfirm={saveDeckPassword}
      onCancel={onCancel}
      okText="OK"
    >
      <p>Password for '{deck?.title}':</p>
      <TextInput password onChange={async (val) => setPassword(val)} />
    </ConfirmModal>
  );
}
