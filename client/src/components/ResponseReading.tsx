import { CSSProperties } from "react";
import { GameLobby, GameTurn, Like, PlayerResponse, ResponseCardInGame } from "../shared/types";
import { CardBottomLeft, CardCenterIcon, CardContent, LargeCard } from "./LargeCard";
import { IconHeart } from "./Icons";
import { useResponseLikes } from "../model/turn-api";

interface Props {
  lobby: GameLobby,
  turn: GameTurn,
  response: PlayerResponse,
  /** Only the judge player can reveal */
  canReveal?: boolean,
  /** When selecting winner */
  canSelect?: boolean,
  selected?: boolean,
  onClick?: (response: PlayerResponse) => void,
  /** Players other than the judge can like the response. */
  canLike?: boolean,
  onClickLike?: (response: PlayerResponse) => void,
  showLikes?: boolean,
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
export function ResponseReading({
  lobby, turn, response, canReveal, canSelect, selected, onClick,
  canLike, onClickLike, showLikes,
}: Props) {
  const [likes] = useResponseLikes(lobby, turn, response);
  const canRevealClass = canReveal ? "can-reveal hoverable-card" : "";
  const revealedClass = response.revealed ? "revealed" : "unrevealed";
  const featureClass = `${canRevealClass} ${revealedClass}`;
  const hasManyCards = response.cards.length > 1;
  function handleClick() {
    if (canReveal && onClick) {
      onClick(response);
    }
  }
  function handleClickLike() {
    if (canLike && onClickLike) {
      onClickLike(response);
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
            response.cards.map((card, i) => {
              const isLastCard = i === response.cards.length - 1;
              return <CardResponseReading key={card.id} card={card} offset={i}
                selectable={canSelect} selected={selected}
                // Only enable likes on the last card of the stack:
                likable={canLike && isLastCard}
                onClickLike={handleClickLike}
                likes={(isLastCard && showLikes) ? likes : []}
              />
              // TODO: insert a "like" button over many cards in fixed position
            })
          }
        </div>
      </div>
    ) : (
      <div className={canSelect ? "hoverable-card" : ""} onClick={handleClick}>
        <CardResponseReading card={response.cards[0]}
          selectable={canSelect} selected={selected}
          likable={canLike} onClickLike={handleClickLike}
          likes={showLikes ? likes : []}
        />
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
  likable?: boolean,
  onClickLike?: () => void,
  likes?: Like[],
}

function CardResponseReading({
  card, offset, selectable, selected, likable, onClickLike, likes
}: CardProps) {
  const overlayClass = (offset && offset > 0) ? "overlaid" : ""
  const selectedClass = `${selectable && "selectable"} ${selected && "selected"}`;
  return (
    <LargeCard className={`card-response response-reading ${selectedClass} ${overlayClass}`}>
      <CardContent>{card.content}</CardContent>
      {likable && (
        <CardCenterIcon className="like-response-container">
          <div className="like-response-button">
            <IconHeart className="like-response-icon" onClick={onClickLike} />
          </div>
        </CardCenterIcon>
      )}
      {likes && <CardBottomLeft>
        {likes.map((_, i) => <IconHeart key={i} className="like-count-icon" />)}
      </CardBottomLeft>}
    </LargeCard>
  );
}

/** Same as ResponseReading, but also displays player's name */
export function ResponseReadingWithName(props: Props) {
  return <div className="game-card-placeholder" style={{ height: "auto" }}>
    <div className="response-player-name" style={{
      width: "100%",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    }}>
      {props.response.player_name}
    </div>
    <ResponseReading {...props} />
  </div>;
}