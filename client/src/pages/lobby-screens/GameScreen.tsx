import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect } from "react";
import { ErrorContext } from "../../components/ErrorContext";
import { GameMenu } from "../../components/GameMenu";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { useLastTurn } from "../../model/turn-api";
import { GameLobby, GameTurn } from "../../shared/types";
import { CardReadingScreen } from "./CardReadingScreen";
import { JudgeAwaitResponsesScreen } from "./JudgeAwaitResponsesScreen";
import { JudgePickPromptScreen } from "./JudgePickPromptScreen";
import { PlayerAnsweringScreen } from "./PlayerAnsweringScreen";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

const menuStyle: CSSProperties = {
  position: "absolute",
  marginLeft: "auto",
  right: "1rem",
  top: "1rem",
}

export function GameScreen({ lobby, user }: ScreenProps) {
  const [turn, loading, error] = useLastTurn(lobby.id);
  const { setError } = useContext(ErrorContext);
  useEffect(() => { if (error) setError(error); }, [error, setError]);
  if (!turn || loading) return <LoadingSpinner delay text="Waiting for next turn..." />;
  // if (!turn) throw new Error("No turn");
  return <TurnScreen turn={turn} lobby={lobby} user={user} />;
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

function TurnScreen(props: TurnProps) {
  const isJudge = props.turn.judge_uid === props.user.uid;
  const className = `game-screen phase-${props.turn.phase} miniscrollbar miniscrollbar-light`;
  return (
    <FillLayout className={className} style={{ overflowY: "auto", }}>
      <div className={`game-bg phase-${props.turn.phase}`} />
      <GameMenu style={menuStyle} {...props} />
      {isJudge ? <JudgeScreen {...props} /> : <PlayerScreen {...props} />}
    </FillLayout>
  );
}

function JudgeScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new": return <JudgePickPromptScreen {...props} />;
    case "answering": return <JudgeAwaitResponsesScreen {...props} />;
    case "reading": return <CardReadingScreen {...props} />;
    case "complete": return <CenteredLayout>Turn ended</CenteredLayout>;
  }
}

function PlayerScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new":
    case "answering": return <PlayerAnsweringScreen {...props} />;
    case "reading": return <CardReadingScreen {...props} />;
    case "complete": return <CenteredLayout>Turn ended</CenteredLayout>;
  }
}