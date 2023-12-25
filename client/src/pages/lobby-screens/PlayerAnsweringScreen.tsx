import { User } from "@firebase/auth";
import { CSSProperties, useState } from "react";
import { CardPrompt } from "../../components/CardPrompt";
import { GameControlRow } from "../../components/GameControlRow";
import { GameHand } from "../../components/GameHand";
import { GameMiniResponses } from "../../components/GameMiniResponses";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { usePlayerData, usePlayerHand } from "../../model/turn-api";
import { GameLobby, GameTurn, PlayerInLobby, PlayerResponse, ResponseCardInGame } from "../../shared/types";

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
  players: PlayerInLobby[],
  responses: PlayerResponse[],
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "1em",
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
  flexWrap: "nowrap",
  padding: "1em",
}
const midRowStyle: CSSProperties = {
  justifyContent: "center",
}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
}
const miniResponsesContainerStyle: CSSProperties = {
  flex: "1 1 auto",
  overflow: "hidden",
  maxHeight: "20rem",
  marginTop: "2em",
}

export function PlayerAnsweringScreen({ lobby, turn, user, players, responses }: TurnProps) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  const [hand] = usePlayerHand(lobby, turn, user.uid);
  const response = responses.find((r) => r.player_uid === user.uid);
  const submitted = response != undefined;
  const [selectedCards, setSelectedCards] = useState<ResponseCardInGame[]>([]);
  return <>
    {hand ? <CenteredLayout style={containerStyle}>
      <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
        <CardPrompt card={turn.prompt} />
        {turn.prompt &&
          <div style={miniResponsesContainerStyle}>
            <GameMiniResponses
              lobby={lobby}
              turn={turn}
              players={players}
              responses={responses}
            />
          </div>
        }
      </div>
      <div className="game-mid-row" style={{ ...rowStyle, ...midRowStyle }}>
        {data ? <GameControlRow
          lobby={lobby}
          turn={turn}
          data={data}
          hand={hand}
          selection={selectedCards} submitted={submitted} players={players}
        /> : (
          // Assume we just joined the game in the middle of it:
          <span className="light">Wait for next turn</span>
        )}
      </div>
      <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
        <GameHand
          lobby={lobby}
          turn={turn}
          user={user}
          pick={turn.prompt?.pick ?? 0}
          hand={hand}
          response={response}
          selectedCards={selectedCards}
          setSelectedCards={setSelectedCards}
        />
      </div>
    </CenteredLayout> :
      <LoadingSpinner delay text="Loading player data..." />}
  </>;
}