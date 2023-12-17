import { User } from "@firebase/auth";
import { CSSProperties, useState } from "react";
import { PromptCard } from "../../components/Cards";
import { GameControlRow } from "../../components/GameControlRow";
import { GameHand } from "../../components/GameHand";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { usePlayerData, usePlayerResponse } from "../../model/turn-api";
import { GameLobby, GameTurn, ResponseCardInGame } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
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

export function PlayerAnsweringScreen({ lobby, turn, user }: TurnProps) {
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