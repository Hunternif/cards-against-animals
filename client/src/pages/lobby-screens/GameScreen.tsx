import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect } from "react";
import { ErrorContext } from "../../components/ErrorContext";
import { GameContext, GameContextState } from "../../components/GameContext";
import { GameMenu } from "../../components/GameMenu";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { FillLayout } from "../../components/layout/FillLayout";
import {
  useAllPlayerResponses,
  useAllTurnPrompts,
  useLastTurn,
  usePlayerDiscard,
  usePlayerHand
} from "../../model/turn-api";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby
} from "../../shared/types";
import { CardReadingScreen } from "./CardReadingScreen";
import { JudgeAwaitResponsesScreen } from "./JudgeAwaitResponsesScreen";
import { JudgePickPromptScreen } from "./JudgePickPromptScreen";
import { PlayerAnsweringScreen } from "./PlayerAnsweringScreen";
import { WinnerScreen } from "./WinnerScreen";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
  players: PlayerInLobby[],
}

const gameContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
}

export function GameScreen({ lobby, user, players }: ScreenProps) {
  const [turn, loading, error] = useLastTurn(lobby.id);
  const { setError } = useContext(ErrorContext);
  useEffect(() => { if (error) setError(error); }, [error, setError]);
  return (
    <FillLayout style={gameContainerStyle}
      className="game-screen miniscrollbar miniscrollbar-light">
      {(!turn || loading) ? (
        <LoadingSpinner delay text="Waiting for next turn..." />
      ) : (
        <TurnScreen turn={turn} lobby={lobby} user={user} players={players} />
      )}
    </FillLayout>
  );
}

interface PreTurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
}

function TurnScreen({ lobby, turn, user, players }: PreTurnProps) {
  const [prompts, loadingPrompts, error] = useAllTurnPrompts(lobby, turn);
  const [responses, loadingResponses, error2] = useAllPlayerResponses(lobby, turn);
  const [playerDiscard, loadingDiscard, error3] = usePlayerDiscard(lobby, turn, user.uid);
  const [hand, loadingHand, error4] = usePlayerHand(lobby, turn, user.uid);
  const judge = players.find((p) => p.uid === turn.judge_uid);
  const player = players.find((p) => p.uid === user.uid);
  const isJudge = judge?.uid === user.uid;
  const isSpectator = player?.role === "spectator";
  const activePlayers = players.filter((p) =>
    p.role === "player" && p.status === "online");

  const { setError } = useContext(ErrorContext);
  useEffect(() => {
    if (error || error2 || error3 || error4)
      setError(error || error2 || error3 || error4);
  }, [error, error2, error3, error4, setError]);

  if (!responses || loadingResponses ||
    !playerDiscard || loadingDiscard ||
    !prompts || loadingPrompts ||
    !hand || loadingHand || !player || !judge) {
    return <LoadingSpinner delay text="Loading turn data..." />;
  }

  const gameState: GameContextState = {
    user, lobby, players, activePlayers, player, isSpectator, isJudge,
    turn, hand, prompt: prompts?.at(0), judge, responses, playerDiscard,
  };

  return (
    <GameContext.Provider value={gameState}>
      <div className={`game-bg phase-${turn.phase}`} />
      <GameMenu />
      {isJudge ? <JudgeScreen turn={turn} /> :
        isSpectator ? <SpectatorScreen turn={turn} /> :
          <PlayerScreen turn={turn} />}
    </GameContext.Provider >
  );
}

interface TurnProps {
  turn: GameTurn,
}

function JudgeScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new": return <JudgePickPromptScreen />;
    case "answering": return <JudgeAwaitResponsesScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}

function PlayerScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new":
    case "answering": return <PlayerAnsweringScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}

function SpectatorScreen({ turn }: TurnProps) {
  switch (turn.phase) {
    case "new":
    case "answering": return <JudgeAwaitResponsesScreen />;
    case "reading": return <CardReadingScreen />;
    case "complete": return <WinnerScreen />;
  }
}