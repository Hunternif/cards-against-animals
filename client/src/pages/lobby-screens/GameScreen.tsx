import { User } from "firebase/auth";
import { CSSProperties, useState } from "react";
import { PromptCard, ResponseCard } from "../../components/Cards";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { LoadingSpinner } from "../../components/utils";
import { useLastTurn, usePlayerData } from "../../model/turn-api";
import { GameLobby, GameTurn } from "../../shared/types";
import { FillLayout } from "../../components/layout/FillLayout";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "6em",
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
}
const botRowStyle: CSSProperties = {
  justifyContent: "center",
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
  // Set of card ids:
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  function selectCard(cardID: string) {
    const newSelection = selectedCards.slice();
    // Don't select more than required:
    while (newSelection.length >= turn.prompt.pick) {
      newSelection.pop();
    }
    newSelection.push(cardID);
    setSelectedCards(newSelection);
  }
  function deselectCard(cardID: string) {
    const newSelection = selectedCards.slice();
    const index = newSelection.indexOf(cardID);
    if (index > -1) {
      newSelection.splice(index, 1);
      setSelectedCards(newSelection);
    }
  }
  return (
    <FillLayout className="game-screen miniscrollbar miniscrollbar-light"
      style={{ overflowY: "auto", }}>
      <CenteredLayout style={containerStyle}>
        <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
          <PromptCard card={turn.prompt} />
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {data && data.hand.map((card) =>
            <ResponseCard key={card.id} card={card}
              selectable={true}
              selectedIndex={selectedCards.indexOf(card.id)}
              onToggle={(selected) => {
                if (selected) selectCard(card.id);
                else deselectCard(card.id);
              }} />
          )}
        </div>
      </CenteredLayout>
    </FillLayout>
  );
}