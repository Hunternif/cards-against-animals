import { User } from "firebase/auth";
import { CenteredLayout } from "../../components/layout/CenteredLayout";
import { CardInGame, DeckCard, GameLobby, PromptCardInGame, ResponseCardInGame } from "../../shared/types";
import { FillLayout } from "../../components/layout/FillLayout";
import { RowLayout } from "../../components/layout/RowLayout";
import { CSSProperties } from "react";

interface ScreenProps {
  lobby: GameLobby,
  user: User,
}

interface CardProps {
  card: CardInGame,
}

const screenStyle: CSSProperties = {

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

function Card({ card }: CardProps) {
  const isPrompt = card instanceof PromptCardInGame;
  const isResponse = card instanceof ResponseCardInGame;
  const className = `game-card ${isPrompt ? "card-prompt" : ""} ${isResponse ? "card-response" : ""}`;
  return <div className={className}>
    <span>{card.content}</span>
  </div>;
}

const dummyPrompt = new PromptCardInGame("0", "0", 0,
  "Coming to Broadway this season, ___, the musical.");
const dummyResponse = new ResponseCardInGame("0", "1", 1, "The milkman");
const hand = new Array<ResponseCardInGame>(10).fill(dummyResponse, 0, 10);

export function GameScreen({ lobby, user }: ScreenProps) {
  const [handCards] = [hand];
  return (
    <CenteredLayout className="game-screen" style={screenStyle}>
      <div style={containerStyle}>
        <div className="game-top-row" style={{ ...rowStyle, ...topRowStyle }}>
          <Card card={dummyPrompt} />
        </div>
        <div className="game-bottom-row" style={{ ...rowStyle, ...botRowStyle }}>
          {handCards.map((card, i) => <Card key={i} card={card} />)}
        </div>
      </div>
    </CenteredLayout>
  );
}