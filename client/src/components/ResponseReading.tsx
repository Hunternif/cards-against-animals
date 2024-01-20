import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { useResponseLikes } from "../model/turn-api";
import { GameLobby, GameTurn, Like, PlayerResponse, ResponseCardInGame } from "../shared/types";
import { IconHeart } from "./Icons";
import { CardBottomLeft, CardCenterIcon, CardContentWithRef, LargeCard } from "./LargeCard";
import { detectDeer, detectLenich } from "../model/deck-api";

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

/**
 * From the "reading" phase, when the judge reveals player responses
 * one by one.
*/
export function ResponseReading({
  lobby, turn, response, canReveal, canSelect, selected, onClick,
  canLike, onClickLike, showLikes,
}: Props) {
  const [likes] = useResponseLikes(lobby, turn, response);
  const likeIcon = showLikes ? <LikeIcon response={response} /> : null;
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
      <ManyCardsStack
        response={response}
        canSelect={canSelect}
        selected={selected}
        onClick={handleClick}
        canLike={canLike}
        onClickLike={handleClickLike}
        likes={showLikes ? likes : undefined}
        className={featureClass}
        likeIcon={likeIcon}
      />
    ) : (
      <div className={canSelect ? "hoverable-card" : ""} onClick={handleClick}>
        <CardResponseReading card={response.cards[0]}
          selectable={canSelect} selected={selected}
          likable={canLike} onClickLike={handleClickLike}
          likes={showLikes ? likes : undefined}
          likeIcon={likeIcon}
        />
      </div >
    )}</>;
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


interface CardStackProps {
  response: PlayerResponse,
  canSelect?: boolean,
  selected?: boolean,
  onClick?: () => void,
  canLike?: boolean,
  onClickLike?: () => void,
  likes?: Like[],
  likeIcon?: ReactNode,
  className?: string,
}

/** A single response rendered as a stack of multiple cards. */
function ManyCardsStack({
  response, canSelect, selected, onClick, canLike, onClickLike, likes, likeIcon, className,
}: CardStackProps) {
  // Store height and offset value for each card:
  const [heights] = useState(response.cards.map(() => 0));
  const [offsets] = useState<Array<number>>(response.cards.map(() => 0));
  const [finishedMeasuring, setFinishedMeasuring] = useState(false);

  function updateOffsets() {
    if (!finishedMeasuring) {
      let totalOffset = 0;
      heights.forEach((height, i) => {
        totalOffset += height;
        offsets[i] = totalOffset;
      });
      // All measurement will complete during the first render,
      // so no need to do it again:
      setFinishedMeasuring(true);
    }
  }

  // Overlay multiple cards on top of each other.
  // The "Placeholder" component holds place the size of a card:
  return (
    <div className={`game-card-placeholder many-cards ${className}`} style={{
      // Add extra margin below for the overlaid cards:
      // (-18 come from .game-card.overlaid being 2em shorter)
      marginBottom: offsets[offsets.length - 2] - 18,
    }} onClick={onClick}>
      {/* Cards on top have absolute positioning,
          without interfering with the flow of the rest of the page. */}
      {response.cards.map((card, i) => {
        const isLastCard = i === response.cards.length - 1;
        return <CardResponseReading
          key={card.id} card={card}
          isOverlaid={i > 0}
          index={i}
          offset={offsets[i - 1]}
          selectable={canSelect} selected={selected}
          // Only enable likes on the last card of the stack:
          likable={canLike && isLastCard}
          onClickLike={onClickLike}
          likes={isLastCard ? likes : []}
          likeIcon={likeIcon}
          setContentHeight={(height) => {
            heights[i] = height;
            updateOffsets();
          }}
        />
      })}
    </div>
  );
}


interface CardProps {
  card: ResponseCardInGame,
  selectable?: boolean,
  selected?: boolean,
  likable?: boolean,
  onClickLike?: () => void,
  likes?: Like[],
  likeIcon?: ReactNode,
  // Overlaid card data:
  isOverlaid?: boolean,
  index?: number,
  offset?: number,
  setContentHeight?: (height: number) => void,
}

/** Individual response card (not a stack of cards)  */
function CardResponseReading({
  card, selectable, selected, likable, onClickLike, likes, likeIcon,
  isOverlaid, index, offset,
  setContentHeight,
}: CardProps) {
  const overlayClass = isOverlaid ? "overlaid" : "";
  const selectedClass = `${selectable && "selectable"} ${selected && "selected"}`;
  const overlayStyle: CSSProperties | undefined = isOverlaid ? {
    position: "absolute",
    top: (offset ?? 0) + (selected ? 10 * (index ?? 0) : 0),
  } : undefined;

  // Measure content height:
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (setContentHeight && contentRef.current) {
      // Guessing padding size:
      const cardPadding = 12;
      const height = contentRef.current.clientHeight;
      setContentHeight(height + cardPadding);
    }
  }, [setContentHeight, contentRef]);

  return (
    <LargeCard className={`card-response response-reading ${selectedClass} ${overlayClass}`}
      style={overlayStyle}
    >
      <CardContentWithRef ref={contentRef}>{card.content}</CardContentWithRef>
      {likable && (
        <CardCenterIcon className="like-response-container">
          <div className="like-response-button">
            <IconHeart className="like-response-icon" onClick={onClickLike} />
          </div>
        </CardCenterIcon>
      )}
      {likes && <CardBottomLeft>
        {likes.map((_, i) => <span key={i}>{likeIcon}</span>)}
      </CardBottomLeft>}
    </LargeCard>
  );
}

/** Same as ResponseReading, but also displays player's name */
export function ResponseReadingWithName(props: Props) {
  return <div className="game-card-placeholder" style={{ height: "auto" }}>
    <ResponseReading {...props} />
    <div className="response-player-name" style={{
      width: "100%",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    }}>
      {props.response.player_name}
    </div>
  </div>;
}

interface LikeProps {
  response: PlayerResponse
}

/** Returns a custom icon for likes */
function LikeIcon({ response }: LikeProps) {
  if (response.cards.find((c) => detectDeer(c.content))) {
    return <span className="emoji-like">🦌</span>;
  } else if (response.cards.find((c) => detectLenich(c.content))) {
    return <span className="emoji-like">👑</span>;
  } else {
    return <IconHeart className="heart-icon" />;
  }
}