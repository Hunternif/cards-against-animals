import { User } from 'firebase/auth';
import { CSSProperties, useContext, useState } from 'react';
import { Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { leaveLobby } from '../../api/lobby/lobby-join-api';
import { setMyPlayerRole } from '../../api/lobby/lobby-player-api';
import { GameButton } from '../../components/Buttons';
import { ErrorContext } from '../../components/ErrorContext';
import { IconCounter } from '../../components/IconCounter';
import {
  IconArowLeft,
  IconHamburger,
  IconPersonInline,
} from '../../components/Icons';
import { ModalBackdrop } from '../../components/ModalBackdrop';
import { FillLayout } from '../../components/layout/FillLayout';
import { RowLayout } from '../../components/layout/RowLayout';
import { ScreenSizeSwitch } from '../../components/layout/ScreenSizeSwitch';
import { GameLobby, PlayerInLobby } from '../../shared/types';
import { LobbyCreationReadOnly } from './lobby-components/LobbyCreationReadOnly';
import { LobbyCreatorControls } from './lobby-components/LobbyCreatorControls';
import { LobbyPlayerList } from './lobby-components/LobbyPlayerList';

interface Props {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

const sidebarStyle: CSSProperties = {
  paddingTop: '1em',
  paddingBottom: '1em',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const contentStyle: CSSProperties = {
  paddingTop: '1em',
  paddingBottom: '1em',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const scrollableColumnStyle: CSSProperties = {
  overflowY: 'auto',
  paddingLeft: '1em',
  paddingRight: 'calc(1em - 8px)',
};

const menuButtonStyle: CSSProperties = {
  padding: '1rem',
  lineHeight: 1,
  cursor: 'pointer',
};

const overlaySidebarStyle: CSSProperties = {
  position: 'absolute',
  height: '100%',
  width: '16em',
  zIndex: 10,
};

const smallHeaderStyle: CSSProperties = {
  height: '3em',
  marginTop: '0.5em',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  zIndex: 3,
};

/** User logged in AND joined the lobby. */
export function NewLobbyScreen(props: Props) {
  return (
    <FillLayout className="new-lobby-screen">
      <ScreenSizeSwitch
        widthBreakpoint={600}
        smallScreen={<SmallScreenLobby {...props} />}
        bigScreen={<BigScreenLobby {...props} />}
      />
    </FillLayout>
  );
}

function BigScreenLobby(props: Props) {
  return (
    <RowLayout>
      <Col xs="4" md="3" xl="2">
        <PlayerListSidebar {...props} />
      </Col>
      <Col>
        <MainContent {...props} />
      </Col>
    </RowLayout>
  );
}

function SmallScreenLobby(props: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  function openMenu() {
    setMenuOpen(true);
  }
  function closeMenu() {
    setMenuOpen(false);
  }
  return (
    <>
      {menuOpen ? (
        <>
          <div style={overlaySidebarStyle}>
            <div
              style={{
                position: 'absolute',
                ...menuButtonStyle,
                ...smallHeaderStyle,
              }}
              onClick={closeMenu}
            >
              <IconArowLeft width={20} height={20} />
            </div>
            <PlayerListSidebar {...props} />
          </div>
          <ModalBackdrop onClick={closeMenu} />
        </>
      ) : (
        <div style={smallHeaderStyle}>
          <div style={menuButtonStyle} onClick={openMenu}>
            <IconHamburger width={20} height={20} />
          </div>
          <IconCounter
            className="dim lobby-player-counter"
            icon={<IconPersonInline />}
            count={props.players.length}
          />
        </div>
      )}
      <MainContent {...props} />
    </>
  );
}

function MainContent(props: Props) {
  const { lobby, user } = props;
  const isCreator = lobby.creator_uid === user.uid;
  return (
    <div style={contentStyle} className="new-lobby-main-content">
      {isCreator ? (
        <LobbyCreatorControls {...props} />
      ) : (
        <LobbyCreationReadOnly {...props} />
      )}
    </div>
  );
}

function PlayerListSidebar({ lobby, user, players }: Props) {
  const [leaving, setLeaving] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();

  // Count active players:
  const activePlayers = players.filter(
    (p) => p.role === 'player' && p.status !== 'left',
  );
  const spectators = players.filter(
    (p) => p.role === 'spectator' && p.status !== 'left',
  );
  const player = players.find((p) => p.uid === user.uid)!;
  const isCreator = player.uid === lobby.creator_uid;
  const canJoinAsPlayer = activePlayers.length < lobby.settings.max_players;

  async function handleLeave() {
    try {
      setLeaving(true);
      await leaveLobby(lobby, user.uid);
      navigate('/');
    } catch (e: any) {
      setError(e);
    } finally {
      setLeaving(false);
    }
  }

  async function handleSpectate() {
    try {
      setChangingRole(true);
      await setMyPlayerRole(lobby.id, 'spectator');
    } catch (e: any) {
      setError(e);
    } finally {
      setChangingRole(false);
    }
  }

  async function handleJoinAsPlayer() {
    try {
      setChangingRole(true);
      await setMyPlayerRole(lobby.id, 'player');
    } catch (e: any) {
      setError(e);
    } finally {
      setChangingRole(false);
    }
  }

  return (
    <div style={sidebarStyle} className="new-lobby-sidebar">
      <h3 className="player-list-header">
        Players {activePlayers.length}/{lobby.settings.max_players}
      </h3>
      <FillLayout
        style={scrollableColumnStyle}
        className="miniscrollbar miniscrollbar-light"
      >
        <LobbyPlayerList
          lobby={lobby}
          user={user}
          players={activePlayers}
          minSlots={4}
          maxSlots={lobby.settings.max_players}
          extraEmptySlots={2}
        />
        {spectators.length > 0 && (
          <>
            <hr />
            <h3 className="spectator-list-header">
              Spectators {spectators.length}
            </h3>
            <LobbyPlayerList lobby={lobby} user={user} players={spectators} />
          </>
        )}
      </FillLayout>
      <hr />
      <footer>
        {player.role === 'player' && !isCreator && (
          <GameButton
            secondary
            onClick={handleSpectate}
            disabled={changingRole}
          >
            Spectate
          </GameButton>
        )}
        {player.role === 'spectator' && canJoinAsPlayer && (
          <GameButton
            secondary
            onClick={handleJoinAsPlayer}
            disabled={changingRole}
          >
            Join as player
          </GameButton>
        )}
        <GameButton onClick={handleLeave} disabled={leaving}>
          Leave
        </GameButton>
      </footer>
    </div>
  );
}
