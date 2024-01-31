import { CSSProperties, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { IconCat, IconHeart } from "../../../components/Icons";
import { PlayerAvatar } from "../../../components/PlayerAvatar";
import { Twemoji } from "../../../components/Twemoji";
import { useScreenWiderThan } from "../../../components/layout/ScreenSizeSwitch";
import { detectCat, detectDeer, detectLenich } from "../../../model/deck-api";
import { useResponseLikes } from "../../../model/turn-api";
import { PlayerInLobby, PlayerResponse, ResponseCardInGame, Vote } from "../../../shared/types";
import { CardOffsetContext } from "./CardOffsetContext";
import { useGameContext } from "./GameContext";
import { CardBottomLeft, CardCenterIcon, CardContent, LargeCard } from "./LargeCard";

interface Props {
  player?: PlayerInLobby,
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
  showName?: boolean,
}


/**
 * From the "reading" phase, when the judge reveals player responses one by one.
 * Optionally displays player's name.
 */
export function ResponseReading(props: Props) {
  return <>{
    props.showName ? (
      <div className="game-card-placeholder" style={{ height: "auto" }}>
        <ResponseReadingWithoutName {...props} />
        <div className="response-player-name" style={{
          width: "100%",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden",
        }}>
          {props.player && <PlayerAvatar player={props.player} />}
          <span className="player-name">{props.response.player_name}</span>
        </div>
      </div>
    ) : (
      <ResponseReadingWithoutName {...props} />
    )
  }</>;
}

/** The response itself, without player name */
function ResponseReadingWithoutName({
  response, canReveal, canSelect, selected, onClick,
  canLike, onClickLike, showLikes,
}: Props) {
  const { lobby, turn } = useGameContext();
  const [likes] = useResponseLikes(lobby, turn, response);
  const likeIcon = showLikes ? <LikeIcon response={response} /> : null;
  const canRevealClass = canReveal ? "can-reveal hoverable-card" : "";
  const revealedClass = response.revealed ? "revealed" : "unrevealed";
  const canSelectClass = canSelect ? "hoverable-card" : "";
  const selectedClass = selected ? "selected" : "unselected";
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
        likeIcon={likeIcon}
      />
    ) : (
      <div className={`${canSelectClass} ${selectedClass}`} onClick={handleClick}>
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
        className={`card-response response-reading ${canRevealClass} ${revealedClass}`}>
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
  likes?: Vote[],
  likeIcon?: ReactNode,
}

/** A single response rendered as a stack of multiple cards. */
function ManyCardsStack({
  response, canSelect, selected, onClick, canLike, onClickLike, likes, likeIcon,
}: CardStackProps) {
  // Store height and offset value for each card:
  const [heights] = useState(response.cards.map(() => 0));
  const [offsets, setOffsets] = useState<Array<number>>(response.cards.map(() => 0));
  const [finishedMeasuring, setFinishedMeasuring] = useState(false);
  // If selected, the 1.05 scale is already applied to child cards:
  const canSelectClass = canSelect ? "hoverable-card" : "";
  const selectedClass = selected ? "selected" : "unselected";

  // Context to communicate offsets between multiple responses:
  const offsetContext = useContext(CardOffsetContext);
  const shouldAlignGlobalOffsets = useScreenWiderThan(400);

  /** Updates local offests based on measured heights. */
  function measureOffsets() {
    if (!finishedMeasuring) {
      let totalOffset = 0;
      offsets[0] = 0;
      heights.forEach((height, i) => {
        totalOffset += height;
        offsets[i + 1] = totalOffset; // set offset for the next card
      });
      if (shouldAlignGlobalOffsets && offsetContext) {
        // Increase offsets to match globals:
        const maxOffsets = getMaxOffsets(offsets, offsetContext.offsets);
        setOffsets(maxOffsets);
        // Update global offsets manually to communicate with other responses
        // during the same render:
        maxOffsets.forEach((off, i) => {
          offsetContext.offsets[i] = off;
        });
        // Trigger rerender in other responses:
        offsetContext.setOffsets(maxOffsets);
      }
      // All measurement will complete during the first render,
      // so no need to do it again:
      setFinishedMeasuring(true);
    }
  }

  // Whenever another card updates global offsets:
  useEffect(() => {
    if (shouldAlignGlobalOffsets && offsetContext) {
      const maxOffsets = getMaxOffsets(offsets, offsetContext.offsets);
      setOffsets(maxOffsets);
    }
  }, [offsetContext]); // only update when global offsets change

  // Overlay multiple cards on top of each other.
  // The "Placeholder" component holds place the size of a card:
  return (
    <div className={`game-card-placeholder many-cards ${canSelectClass} ${selectedClass}`} style={{
      // Add extra margin below for the overlaid cards:
      // (-18 come from .game-card.overlaid being 2em shorter)
      marginBottom: (offsets.at(-2) ?? 0) - 18,
    }} onClick={onClick}>
      {/* Cards on top have absolute positioning,
          without interfering with the flow of the rest of the page. */}
      {response.cards.map((card, i) => {
        const isLastCard = i === response.cards.length - 1;
        return <CardResponseReading
          key={card.id} card={card}
          isOverlaid={i > 0}
          index={i}
          offset={offsets[i]}
          selectable={canSelect} selected={selected}
          // Only enable likes on the last card of the stack:
          likable={canLike && isLastCard}
          onClickLike={onClickLike}
          likes={isLastCard ? likes : []}
          likeIcon={likeIcon}
          setContentHeight={(height) => {
            heights[i] = height;
            measureOffsets();
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
  likes?: Vote[],
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
  const selectedClass = `${selectable ? "selectable" : ""} ${selected ? "selected" : ""}`;
  const overlayStyle: CSSProperties | undefined = isOverlaid ? {
    position: "absolute",
    top: (offset ?? 0) + (selected ? 4 * (index ?? 0) : 0),
  } : undefined;

  // Measure content height:
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (setContentHeight && contentRef.current) {
      measure(contentRef.current);
    }
  }, [setContentHeight, contentRef, measure]);

  // Detect resize, e.g. after running Twemoji:
  useEffect(() => {
    if (contentRef.current) {
      const elem = contentRef.current;
      const resizeObserver = new ResizeObserver(() => {
        measure(elem);
      });
      resizeObserver.observe(elem);
      return () => resizeObserver.disconnect(); // clean up 
    }
  }, [contentRef, measure]);

  function measure(elem: HTMLElement) {
    if (setContentHeight) {
      // Guessing padding size:
      const cardPadding = 16;
      setContentHeight(elem.clientHeight + cardPadding);
      // console.log(`Measured "${card.content}": ${elem.clientHeight}`);
    }
  }

  return (
    <LargeCard className={`card-response response-reading ${selectedClass} ${overlayClass}`}
      style={overlayStyle}
    >
      <span ref={contentRef}><CardContent>{card.content}</CardContent></span>
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


interface LikeProps {
  response: PlayerResponse
}

/** Returns a custom icon for likes */
function LikeIcon({ response }: LikeProps) {
  for (const card of response.cards) {
    if (detectDeer(card.content)) {
      return <Twemoji className="emoji-like">🦌</Twemoji>;
    } else if (detectCat(card.content)) {
      return <IconCat className="cat-icon" />;
    } else if (detectLenich(card.content)) {
      if (response.cards[0].random_index % 2 == 0) {
        return <Twemoji className="emoji-like">👑</Twemoji>;
      } else {
        return <IconCat className="cat-icon" />;
      }
    }
  }
  return <IconHeart className="heart-icon" />;
}

/** Returns an array with the biggest of the 2 offsets. */
function getMaxOffsets(localOffsets: number[], globalOffsets: number[]): number[] {
  const result = new Array<number>();
  const length = Math.max(localOffsets.length, globalOffsets.length);
  for (let i = 0; i < length; i++) {
    const maxOffset = Math.max(localOffsets[i] ?? 0, globalOffsets[i] ?? 0);
    result[i] = maxOffset;
  }
  return result;
}