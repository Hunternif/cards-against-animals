import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect } from "react";
import { ErrorContext } from "../../components/ErrorContext";
import { GameMenu } from "../../components/GameMenu";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { FillLayout } from "../../components/layout/FillLayout";
import { useAllPlayerResponses, useLastTurn, usePlayerData } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerDataInTurn, PlayerInLobby, PlayerResponse } from "../../shared/types";
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

const menuStyle: CSSProperties = {
  position: "absolute",
  marginLeft: "auto",
  right: "1rem",
  top: "1rem",
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
  const [responses, loading, error] = useAllPlayerResponses(props.lobby, props.turn);
  const { setError } = useContext(ErrorContext);
  useEffect(() => { if (error) setError(error); }, [error, setError]);
  const isJudge = props.turn.judge_uid === props.user.uid;
  const isSpectator = props.players.find((p) => p.uid === props.user.uid)?.role === "spectator";
  const className = `game-screen phase-${props.turn.phase} miniscrollbar miniscrollbar-light`;

  if (!responses || loading) {
    return <LoadingSpinner delay text="Loading turn data..." />
  }
  const newProps = { responses, ...props };
  return (
    <FillLayout className={className} style={{ overflowY: "auto", }}>
      <div className={`game-bg phase-${props.turn.phase}`} />
      <GameMenu style={menuStyle} {...newProps} />
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
  players: PlayerInLobby[],
  responses: PlayerResponse[],
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