import { CSSProperties } from "react";
import { PlayerResponse, ResponseCardInGame } from "../shared/types";
import { CardCenterIcon, CardContent, LargeCard } from "./LargeCard";

interface Props {
  response: PlayerResponse,
  /** Only the judge player can reveal */
  canReveal?: boolean,
  /** When selecting winner */
  canSelect?: boolean,
  selected?: boolean,
  onClick?: (response: PlayerResponse) => void,
}

const cardCombinerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyItems: "flex-start",
  alignItems: "space-between",
  position: "absolute",
}

/**
 * From the "reading" phase, when the judge reveals player responses
 * one by one.
*/
export function ResponseReading(
  { response, canReveal, canSelect, selected, onClick }: Props
) {
  const canRevealClass = canReveal ? "can-reveal hoverable-card" : "";
  const revealedClass = response.revealed ? "revealed" : "unrevealed";
  const featureClass = `${canRevealClass} ${revealedClass}`;
  const hasManyCards = response.cards.length > 1;
  function handleClick() {
    if (canReveal && onClick) {
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
        position: "relative",
      }} onClick={handleClick}>
        {/* Card combiner renders cards on top with absolute positioning,
            without interfering with the flow of the rest of the page.*/}
        <div style={cardCombinerStyle} className={`many-cards ${featureClass}`} >
          {
            response.cards.map((card, i) =>
              <ResponseReadingCard key={card.id} card={card} offset={i}
                selectable={canSelect} selected={selected} />
            )
          }
        </div>
      </div>
    ) : (
      <div className={canSelect ? "hoverable-card" : ""} onClick={handleClick}>
        <ResponseReadingCard card={response.cards[0]}
          selectable={canSelect} selected={selected} />
      </div>
    )
    }</>;
  } else {
    return (
      <LargeCard onClick={handleClick}
        className={`card-response response-reading ${featureClass}`}>
        <CardCenterIcon className="reading-unrevealed-icon">
          ?
        </CardCenterIcon>
      </LargeCard>
    );
  }
}

interface CardProps {
  card: ResponseCardInGame,
  selectable?: boolean,
  selected?: boolean,
  offset?: number,
}

function ResponseReadingCard({ card, offset, selectable, selected }: CardProps) {
  const overlayClass = (offset && offset > 0) ? "overlaid" : ""
  const selectedClass = `${selectable && "selectable"} ${selected && "selected"}`;
  return (
    <LargeCard className={`card-response response-reading ${selectedClass} ${overlayClass}`}>
      <CardContent>{card.content}</CardContent>
    </LargeCard>
  );
}