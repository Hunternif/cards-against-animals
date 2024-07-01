import { User } from 'firebase/auth';
import { useContext, useState } from 'react';
import { startLobby } from '../../../api/lobby/lobby-control-api';
import { updateLobby } from '../../../api/lobby/lobby-repository';
import { GameButton } from '../../../components/Buttons';
import { Timed } from '../../../components/Delay';
import { ErrorContext } from '../../../components/ErrorContext';
import { IconLink, IconPlay } from '../../../components/Icons';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ScrollContainer } from '../../../components/layout/ScrollContainer';
import { GameLobby } from '../../../shared/types';
import { DeckSelector } from './DeckSelector';
import { LobbySettingsPanel } from './LobbySettingsPanel';

interface Props {
  user: User;
  lobby: GameLobby;
}

export function LobbyCreatorControls(props: Props) {
  const { lobby } = props;
  const [starting, setStarting] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const { setError } = useContext(ErrorContext);

  async function handleStart() {
    setStarting(true);
    try {
      await startLobby(lobby);
    } catch (e: any) {
      setError(e);
      setStarting(false);
    }
  }

  async function handleInvite() {
    // Copies link
    navigator.clipboard.writeText(document.URL);
    setShowLink(true);
  }

  async function handleSettingsChange() {
    // Creator can change settings directly.
    await updateLobby(lobby).catch((e) => setError(e));
  }

  if (starting) return <LoadingSpinner text="Starting..." delay />;
  return (
    <>
      <header>
        <h3>Select decks</h3>
      </header>
      <ScrollContainer scrollLight className="content">
        <DeckSelector {...props} />
        <LobbySettingsPanel
          settings={lobby.settings}
          onChange={handleSettingsChange}
        />
      </ScrollContainer>
      <footer>
        <GameButton
          light
          className="start-button"
          onClick={handleInvite}
          iconLeft={<IconLink />}
        >
          Invite
          {showLink && (
            <Timed onClear={() => setShowLink(false)}>
              <span className="light link-copied-popup">Link copied</span>
            </Timed>
          )}
        </GameButton>
        <GameButton
          accent
          className="start-button"
          onClick={handleStart}
          disabled={lobby.deck_ids.size == 0}
          iconLeft={<IconPlay />}
        >
          Start
        </GameButton>
      </footer>
    </>
  );
}
