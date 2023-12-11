import { User } from "firebase/auth";
import { CSSProperties, useState } from "react";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { LoadingSpinner } from "../../components/utils";
import { useLastTurn, usePlayerData } from "../../model/turn-api";
import { CardInGame, GameLobby, GameTurn, PromptCardInGame, ResponseCardInGame } from "../../shared/types";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

interface CardProps {
  card: CardInGame,
  selectable?: boolean,
  selected?: boolean,
  onToggle?: (selected: boolean) => void,
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

function Card({ card, selectable, selected, onToggle }: CardProps) {
  const isPrompt = card instanceof PromptCardInGame;
  const isResponse = card instanceof ResponseCardInGame;
  const promptStyle = isPrompt ? "card-prompt" : "";
  const responseStyle = isResponse ? "card-response" : "";
  const selectableStyle = selectable ? "hoverable-card" : "";
  const selectedStyle = selected ? "selected" : "";
  const className = `game-card ${promptStyle} ${responseStyle} ${selectableStyle} ${selectedStyle}`;
  function handleClick() {
    if (onToggle) onToggle(!selected);
  }
  return <div className={className} onClick={handleClick}>
    <span>{card.content}</span>
  </div>;
}

export function GameScreen({ lobby, user }: ScreenProps) {
  const [turn, loading] = useLastTurn(lobby.id);
  if (!turn || loading) return <LoadingSpinner text="Waiting for next turn..."/>;
  // if (!turn) throw new Error("No turn");
  return <TurnScreen turn={turn} lobby={lobby} user={user}/>;
}

interface TurnProps {
  lobby: GameLobby,
  turn: GameTurn,
  user: User,
}

function TurnScreen({lobby, turn, user}: TurnProps) {
  const [data] = usePlayerData(lobby, turn, user.uid);
  // Set of card ids:
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  function selectCard(cardID: string) {
    setSelectedCards(new Set(selectedCards).add(cardID));
  }
  function deselectCard(cardID: string) {
    const newSelection = new Set(selectedCards);
    newSelection.delete(cardID);
    setSelectedCards(newSelection);
  }
  return (
    <CenteredLayout className="game-screen">
      <div style={containerStyle}>
        <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
          <Card card={turn.prompt} />
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {data && data.hand.map((card) =>
            <Card key={card.id} card={card}
              selectable={true}
              selected={selectedCards.has(card.id)}
              onToggle={(selected) => {
                if (selected) selectCard(card.id);
                else deselectCard(card.id);
              }} />
          )}
        </div>
      </div>
    </CenteredLayout>
  );
}