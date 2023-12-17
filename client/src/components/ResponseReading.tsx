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
}

const cardPlaceholderStyle: CSSProperties = {
  position: "relative",
}

const cardCombinerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyItems: "flex-start",
  alignItems: "space-between",
  position: "absolute",
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
  const hasManyCards = response.cards.length > 1;
  function handleClick() {
    if (canReveal) {
      onClick(response);
    }
  }
  if (response.revealed) {
    return <>{hasManyCards ? (
      /* Overlay multiple cards on top of each other */
      /* "Placeholder" component holds place the size of a card */
      <div className="game-card-placeholder" style={{
        // Add extra margin below for the overlaid cards:
        marginBottom: `${response.cards.length}em`,
        ...cardPlaceholderStyle
      }}>
        {/* Card combiner renders cards on top with absolute positioning,
            without interfering with the flow of the rest of the page.*/}
        <div style={cardCombinerStyle} className="many-cards" >
          {
            response.cards.map((card, i) =>
              <ResponseReadingCard key={card.card_id} card={card} offset={i} />
            )
          }
        </div>
      </div>
    ) : (
      <ResponseReadingCard card={response.cards[0]} />
    )
    }</>;
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
  offset?: number,
}

function ResponseReadingCard({ card, offset }: CardProps) {
  const offsetStyle: CSSProperties | null = (offset && offset > 0) ? {
    // position: "absolute",
    top: `${20 * offset}%`,
    // left: `${1 * offset}%`,
    // transform: `rotate(${offset}deg)`,
    // marginTop: `-${100}%`,
  } : null;
  const className = (offset && offset > 0) ? "overlaid" : ""
  return (
    <div className={`game-card card-response response-reading revealed ${className}`}
      style={{ ...containerStyle }}>
      <span style={{ whiteSpace: "pre-line" }}>{card.content}</span>
    </div>
  );
}