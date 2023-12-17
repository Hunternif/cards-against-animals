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

const cardCombinerStyle: CSSProperties = {
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
    return <div style={cardCombinerStyle}>
      {response.cards.map((card, i) =>
        <ResponseReadingCard key={card.card_id} card={card} offset={i} />
      )}
    </div>
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
  className?: string,
  style?: CSSProperties,
  offset: number,
}

function ResponseReadingCard({ card, className, style, offset }: CardProps) {
  const offsetStyle: CSSProperties | null = offset > 0 ? {
    position: "absolute",
    top: `${20 * offset}%`,
    left: `${1 * offset}%`,
    // transform: `rotate(${offset}deg)`,
  } : null;
  return (
    <div className={`game-card card-response response-reading revealed ${className}`}
      style={{ ...containerStyle, ...offsetStyle, ...style }}>
      <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    </div>
  );
}