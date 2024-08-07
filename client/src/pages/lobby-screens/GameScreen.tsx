import { User } from 'firebase/auth';
import { CSSProperties, useContext, useEffect } from 'react';
import { usePlayerState } from '../../api/lobby/lobby-hooks';
import {
  useAllPlayerResponses,
  useAllTurnPrompts,
  useLastTurn,
} from '../../api/turn/turn-hooks';
import { ErrorContext } from '../../components/ErrorContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FillLayout } from '../../components/layout/FillLayout';
import { useSoundboardSound } from '../../hooks/sound-hooks';
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  ResponseCardInGame,
} from '../../shared/types';
import { assertExhaustive } from '../../shared/utils';
import { CardReadingScreen } from './CardReadingScreen';
import { JudgeAwaitResponsesScreen } from './JudgeAwaitResponsesScreen';
import { JudgePickPromptScreen } from './JudgePickPromptScreen';
import { PlayerAnsweringScreen } from './PlayerAnsweringScreen';
import { WinnerScreen } from './WinnerScreen';
import { GameContext, GameContextState } from './game-components/GameContext';
import { GameHeader } from './game-components/header/GameHeader';

interface ScreenProps {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
}

const gameContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

export function GameScreen({ lobby, user, players }: ScreenProps) {
  const [turn, loadingTurn, error] = useLastTurn(lobby);
  const { setError } = useContext(ErrorContext);
  useEffect(() => {
    if (error) setError(error);
  }, [error, setError]);

  return (
    <FillLayout
      style={gameContainerStyle}
      className="game-screen miniscrollbar miniscrollbar-light"
    >
      {!turn ? (
        <LoadingSpinner delay text="Waiting for next turn..." />
      ) : (
        <TurnScreen turn={turn} lobby={lobby} user={user} players={players} />
      )}
    </FillLayout>
  );
}

interface PreTurnProps {
  lobby: GameLobby;
  turn: GameTurn;
  user: User;
  players: PlayerInLobby[];
}

function TurnScreen({ lobby, turn, user, players }: PreTurnProps) {
  const [prompts, loadingPrompts, error] = useAllTurnPrompts(lobby, turn);
  const [responses, loadingResp, error2] = useAllPlayerResponses(lobby, turn);
  const [playerState, loadingState, error3] = usePlayerState(lobby, user.uid);

  const judge = players.find((p) => p.uid === turn.judge_uid);
  const player = players.find((p) => p.uid === user.uid);
  const isJudge = judge?.uid === user.uid;
  const isSpectator = player?.role === 'spectator';
  const isCreator = lobby.creator_uid === user.uid;
  const activePlayers = players.filter(
    (p) => p.role === 'player' && p.status === 'online',
  );
  const lobbyControl = lobby.settings.lobby_control;

  let canControlLobby = false;
  switch (lobbyControl) {
    case 'anyone':
      canControlLobby = true;
      break;
    case 'players':
      canControlLobby = player?.role === 'player';
      break;
    case 'creator_or_czar':
      canControlLobby = isCreator || isJudge;
      break;
    case 'creator':
      canControlLobby = isCreator;
      break;
    default:
      assertExhaustive(lobbyControl);
  }

  const { setError } = useContext(ErrorContext);
  if (error || error2 || error3) setError(error || error2 || error3);

  if (!player) {
    setError('Current player is not in lobby');
    return <></>;
  }
  if (!judge) {
    setError('No judge');
    return <></>;
  }

  const hand = Array.from(playerState.hand.values());
  const gameState: GameContextState = {
    user,
    lobby,
    players,
    activePlayers,
    player,
    playerState,
    isSpectator,
    isJudge,
    isCreator,
    turn,
    hand,
    prompt: prompts.at(0),
    judge,
    responses,
    canControlLobby,
  };

  return (
    <GameContext.Provider value={gameState}>
      <div className={`game-bg phase-${turn.phase}`} />
      <GameHeader />
      {isJudge ? (
        <JudgeScreen turn={turn} />
      ) : isSpectator ? (
        <SpectatorScreen turn={turn} />
      ) : (
        <PlayerScreen turn={turn} />
      )}
    </GameContext.Provider>
  );
}

interface TurnProps {
  turn: GameTurn;
}

function JudgeScreen({ turn }: TurnProps) {
  useSoundboardSound();
  switch (turn.phase) {
    case 'new':
      return <JudgePickPromptScreen />;
    case 'answering':
      return <JudgeAwaitResponsesScreen />;
    case 'reading':
      return <CardReadingScreen />;
    case 'complete':
      return <WinnerScreen />;
    default:
      assertExhaustive(turn.phase);
  }
}

function PlayerScreen({ turn }: TurnProps) {
  useSoundboardSound();
  switch (turn.phase) {
    case 'new':
    case 'answering':
      return <PlayerAnsweringScreen />;
    case 'reading':
      return <CardReadingScreen />;
    case 'complete':
      return <WinnerScreen />;
    default:
      assertExhaustive(turn.phase);
  }
}

function SpectatorScreen({ turn }: TurnProps) {
  useSoundboardSound();
  switch (turn.phase) {
    case 'new':
    case 'answering':
      return <JudgeAwaitResponsesScreen />;
    case 'reading':
      return <CardReadingScreen />;
    case 'complete':
      return <WinnerScreen />;
    default:
      assertExhaustive(turn.phase);
  }
}

/** Compares 2 hands by card ids */
function isHandEqual(
  hand1: ResponseCardInGame[],
  hand2: ResponseCardInGame[],
): boolean {
  if (hand1.length !== hand2.length) return false;
  for (let i = 0; i < hand1.length; i++) {
    if (hand1[i].id !== hand2[i].id) return false;
  }
  return true;
}
