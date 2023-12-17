import { User } from "firebase/auth";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { PromptCard } from "../../components/Cards";
import { ErrorContext } from "../../components/ErrorContext";
import { GameControlRow } from "../../components/GameControlRow";
import { GameHand } from "../../components/GameHand";
import { GameMenu } from "../../components/GameMenu";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { useLastTurn, usePlayerData, usePlayerResponse } from "../../model/turn-api";
import { GameLobby, GameTurn, ResponseCardInGame } from "../../shared/types";
import { JudgePickPromptScreen } from "./JudgePickPromptScreen";
import { JudgeAwaitResponsesScreen } from "./JudgeAwaitResponsesScreen";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "1em",
  padding: "1.5em",
};
const rowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "row",
  flexBasis: 1,
  flexWrap: "wrap",
  gap: "1em",
};
const topRowStyle: CSSProperties = {
  justifyContent: "flex-start",
  flexWrap: "wrap",
}
const midRowStyle: CSSProperties = {}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
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
  return (
    <FillLayout className="game-screen miniscrollbar miniscrollbar-light"
      style={{ overflowY: "auto", }}>
      <GameMenu style={menuStyle} {...props} />
      {isJudge ? <JudgeScreen {...props} /> : <PlayerScreen {...props} />}
    </FillLayout>
  );
}

function JudgeScreen(props: TurnProps) {
  switch (props.turn.phase) {
    case "new": return <JudgePickPromptScreen {...props} />;
    case "answering": return <JudgeAwaitResponsesScreen {...props} />;
    case "reading": return <JudgeReadingScreen {...props} />;
    case "judging": return <JudgeJudgingScreen {...props} />;
    case "complete": return <CenteredLayout>Turn ended</CenteredLayout>;
  }
}

function PlayerScreen({ lobby, turn, user }: TurnProps) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  const [response] = usePlayerResponse(lobby, turn, user.uid);
  const submitted = response != undefined;
  const [selectedCards, setSelectedCards] = useState<ResponseCardInGame[]>([]);
  return <>
    {data ? <CenteredLayout style={containerStyle}>
      <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
        <PromptCard card={turn.prompt} />
        <GameMiniResponses lobby={lobby} turn={turn} />
      </div>
      <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
        <GameControlRow lobby={lobby} turn={turn} userID={user.uid}
          userName={data.player_name} selection={selectedCards}
          submitted={submitted} />
      </div>
      <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
        <GameHand pick={turn.prompt?.pick ?? 0} playerData={data} response={response}
          selectedCards={selectedCards} setSelectedCards={setSelectedCards} />
      </div>
    </CenteredLayout> :
      <LoadingSpinner delay text="Loading..." />}
  </>;
}

function JudgeReadingScreen({ lobby, turn, user }: TurnProps) {
  return <CenteredLayout>Read out the responses</CenteredLayout>;
}

function JudgeJudgingScreen({ lobby, turn, user }: TurnProps) {
  return <CenteredLayout>Pick the best response</CenteredLayout>;
}