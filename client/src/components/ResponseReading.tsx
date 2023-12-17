import { CSSProperties } from "react";
import { PlayerResponse, ResponseCardInGame } from "../shared/types";
import { FillLayout } from "./layout/FillLayout";

interface Props {
  response: PlayerResponse,
  /** Only the judge player can reveal */
  canReveal: boolean,
  onClick: (response: PlayerResponse) => void,
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
}

const fillCardStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  position: "absolute",
  top: 0,
  left: 0,
}

/**
 * From the "reading" phase, when the judge reveals player responses
 * one by one.
*/
export function ResponseReading({ response, canReveal, onClick }: Props) {
  const canRevealClass = canReveal ? "can-reveal hoverable-card" : "";
  const revealedClass = response.revealed ? "revealed" : "unrevealed";
  const className = `game-card card-response response-reading ${canRevealClass} ${revealedClass}`;
  function handleClick() {
    if (canReveal) {
      onClick(response);
    }
  }
  if (response.revealed) {
    return <>
      {// TODO: overlay multiple cards
        response.cards.map((card) =>
          <ResponseReadingCard key={card.card_id} card={card} />
        )
      }
    </>
  } else {
    return (
      <div className={className} onClick={handleClick} style={containerStyle}>
        <FillLayout className="reading-unrevealed-icon" style={fillCardStyle} >
          ?
        </FillLayout>
      </div>
    );
  }
}

interface CardProps {
  card: ResponseCardInGame,
}

function ResponseReadingCard({ card }: CardProps) {
  return (
    <div className="game-card card-response response-reading revealed"
      style={containerStyle}>
      <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    </div>
  );
}