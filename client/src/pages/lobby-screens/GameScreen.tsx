import { User } from "firebase/auth";
import { CSSProperties, useState } from "react";
import { PromptCard } from "../../components/Cards";
import { GameControlRow } from "../../components/GameControlRow";
import { GameHand } from "../../components/GameHand";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { FillLayout } from "../../components/layout/FillLayout";
import { LoadingSpinner } from "../../components/utils";
import { useLastTurn, usePlayerData, usePlayerResponse } from "../../model/turn-api";
import { GameLobby, GameTurn, ResponseCardInGame } from "../../shared/types";
import { GameMenu } from "../../components/GameMenu";

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
  const [turn, loading] = useLastTurn(lobby.id);
  if (!turn || loading) return <LoadingSpinner text="Waiting for next turn..." />;
  // if (!turn) throw new Error("No turn");
  return <TurnScreen turn={turn} lobby={lobby} user={user} />;
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

function TurnScreen({ lobby, turn, user }: TurnProps) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  const [response] = usePlayerResponse(lobby, turn, user.uid);
  const submitted = response != undefined;
  // Set of card ids:
  const [selectedCards, setSelectedCards] = useState<ResponseCardInGame[]>([]);

  return (
    <FillLayout className="game-screen miniscrollbar miniscrollbar-light"
      style={{ overflowY: "auto", }}>
      <GameMenu style={menuStyle} />
      <CenteredLayout style={containerStyle}>
        <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
          <PromptCard card={turn.prompt} />
          <GameMiniResponses lobby={lobby} turn={turn} />
        </div>
        <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
          {data && <GameControlRow lobby={lobby} turn={turn} userID={user.uid}
            userName={data.player_name} selection={selectedCards}
            submitted={submitted} />}
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {data && <GameHand pick={turn.prompt.pick} playerData={data} response={response}
            selectedCards={selectedCards} setSelectedCards={setSelectedCards} />}
        </div>
      </CenteredLayout>
    </FillLayout>
  );
}