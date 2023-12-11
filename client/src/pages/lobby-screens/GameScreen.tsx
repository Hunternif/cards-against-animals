import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { CardInGame, DeckCard, GameLobby, PromptCardInGame, ResponseCardInGame } from "../../shared/types";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { CSSProperties, useState } from "react";

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

const dummyPrompt = new PromptCardInGame("0", "0", "0", 0,
  "Coming to Broadway this season, ___, the musical.", 0);
const dummyResponse = new ResponseCardInGame("1", "0", "1", 1, "The milkman", 0);
const hand = new Array<ResponseCardInGame>(10).fill(dummyResponse, 0, 10);

export function GameScreen({ lobby, user }: ScreenProps) {
  const [handCards] = [hand];
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
          <Card card={dummyPrompt} />
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {handCards.map((card, i) =>
            <Card key={i} card={card}
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