import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect } from "react";
import { ErrorContext } from "../../components/ErrorContext";
import { GameMenu } from "../../components/GameMenu";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { FillLayout } from "../../components/layout/FillLayout";
import { useAllPlayerResponses, useAllTurnPrompts, useLastTurn, usePlayerDiscard } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse, PromptCardInGame, ResponseCardInGame } from "../../shared/types";
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
  if (!turn || loading) return <LoadingSpinner delay text="Waiting for next turn..." />;
  // if (!turn) throw new Error("No turn");
  return <TurnScreen turn={turn} lobby={lobby} user={user} players={players} />;
}

interface PreTurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
}

function TurnScreen(props: PreTurnProps) {
  const [prompts, loadingPrompts, error] = useAllTurnPrompts(props.lobby, props.turn);
  const [responses, loadingResponses, error2] = useAllPlayerResponses(props.lobby, props.turn);
  const [playerDiscard, loadingDiscard, error3] = usePlayerDiscard(props.lobby, props.turn, props.user.uid);
  const { setError } = useContext(ErrorContext);
  useEffect(() => {
    if (error || error2 || error3) setError(error || error2 || error3);
  }, [error, setError]);
  const judge = props.players.find((p) => p.uid === props.turn.judge_uid);
  const isJudge = judge?.uid === props.user.uid;
  const isSpectator = props.players.find((p) => p.uid === props.user.uid)?.role === "spectator";
  const className = `game-screen phase-${props.turn.phase} miniscrollbar miniscrollbar-light`;

  if (!responses || loadingResponses || !playerDiscard || loadingDiscard) {
    return <LoadingSpinner delay text="Loading turn data..." />;
  }
  const newProps = { responses, playerDiscard, judge, prompt: prompts?.at(0), ...props };
  return (
    <FillLayout className={className} style={gameContainerStyle}>
      <div className={`game-bg phase-${props.turn.phase}`} />
      <GameMenu {...newProps} />
      {isJudge ? <JudgeScreen {...newProps} /> :
        isSpectator ? <SpectatorScreen {...newProps} /> :
          <PlayerScreen {...newProps} />}
    </FillLayout>
  );
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  prompt?: PromptCardInGame,
  judge?: PlayerInLobby,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
  playerDiscard: ResponseCardInGame[],
}

function JudgeScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new": return <JudgePickPromptScreen {...props} />;
    case "answering": return <JudgeAwaitResponsesScreen {...props} />;
    case "reading": return <CardReadingScreen {...props} />;
    case "complete": return <WinnerScreen {...props} />;
  }
}

function PlayerScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new":
    case "answering": return <PlayerAnsweringScreen {...props} />;
    case "reading": return <CardReadingScreen {...props} />;
    case "complete": return <WinnerScreen {...props} />;
  }
}

function SpectatorScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new":
    case "answering": return <JudgeAwaitResponsesScreen {...props} />;
    case "reading": return <CardReadingScreen {...props} />;
    case "complete": return <WinnerScreen {...props} />;
  }
}