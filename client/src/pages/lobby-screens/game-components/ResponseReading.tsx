import { CSSProperties, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { IconCat, IconHeadshot, IconHeart, IconStarOfDavid } from "../../../components/Icons";
import { PlayerAvatar } from "../../../components/PlayerAvatar";
import { Twemoji } from "../../../components/Twemoji";
import { useScreenWiderThan } from "../../../components/layout/ScreenSizeSwitch";
import { detectCat, detectDeer, detectLenich } from "../../../api/deck/deck-parser";
import { useResponseLikes } from "../../../api/turn/turn-hooks";
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
  return <>{hasManyCards ? (
    <ManyCardsStack
      response={response}
      canReveal={canReveal}
      canSelect={canSelect}
      selected={selected}
      onClick={handleClick}
      canLike={canLike}
      onClickLike={handleClickLike}
      likes={showLikes ? likes : undefined}
      likeIcon={likeIcon}
    />
  ) : (
    <div className={`${canRevealClass} ${canSelectClass} ${selectedClass}`} onClick={handleClick}>
      <CardResponseReading card={response.cards[0]}
        content={response.cards[0].content}
        revealed={response.reveal_count > 0}
        selectable={canSelect} selected={selected}
        likable={canLike} onClickLike={handleClickLike}
        likes={showLikes ? likes : undefined}
        likeIcon={likeIcon}
      />
    </div >
  )}</>;
}


interface CardStackProps {
  response: PlayerResponse,
  canReveal?: boolean,
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
  response, canReveal, canSelect, selected, onClick,
  canLike, onClickLike, likes, likeIcon,
}: CardStackProps) {
  // Store height and offset value for each card:
  const [heights] = useState(response.cards.map(() => 0));
  const [offsets] = useState<Array<number>>(response.cards.map(() => 0));
  const [finishedMeasuring, setFinishedMeasuring] = useState(false);
  const canRevealClass = canReveal ? "can-reveal hoverable-card" : "";
  // If selected, the 1.05 scale is already applied to child cards:
  const canSelectClass = canSelect ? "hoverable-card" : "";
  const selectedClass = selected ? "selected" : "unselected";

  // Context to communicate offsets between multiple responses:
  const offsetContext = useContext(CardOffsetContext);
  const shouldAlignGlobalOffsets = useScreenWiderThan(400);

  // After any card is revealed, re-measure:
  const [revealCount, setRevealCount] = useState(response.reveal_count);
  if (response.reveal_count > revealCount) {
    setRevealCount(response.reveal_count);
    setFinishedMeasuring(false);
  }

  /** Updates local offests based on measured heights. */
  function measureOffsets() {
    if (!finishedMeasuring) {
      calculateOffsets(heights);
      if (shouldAlignGlobalOffsets && offsetContext) {
        // Increase offsets to match globals:
        const maxHeights = getMaxItems(heights, offsetContext.heights);
        calculateOffsets(maxHeights);
        // Update global offsets manually to communicate with other responses
        // during the same render:
        maxHeights.forEach((val, i) => {
          offsetContext.heights[i] = val;
        });
        // Trigger rerender in other responses:
        offsetContext.setHeights(maxHeights);
      }
      // All measurement will complete during the first render,
      // so no need to do it again:
      setFinishedMeasuring(true);
    }
  }

  /** Calculates offests from heights */
  function calculateOffsets(heights: number[]) {
    let totalOffset = 0;
    offsets[0] = 0;
    heights.forEach((height, i) => {
      totalOffset += height;
      offsets[i + 1] = totalOffset; // set offset for the next card
    });
  }

  // Whenever another card updates global offsets:
  useEffect(() => {
    if (shouldAlignGlobalOffsets && offsetContext) {
      const maxHeights = getMaxItems(heights, offsetContext.heights);
      calculateOffsets(maxHeights);
    }
  }, [offsetContext]); // only update when global offsets change

  // Overlay multiple cards on top of each other.
  // The "Placeholder" component holds place the size of a card:
  return (
    <div className={`game-card-placeholder many-cards ${canRevealClass} ${canSelectClass} ${selectedClass}`} style={{
      // Add extra margin below for the overlaid cards:
      // (-18 come from .game-card.overlaid being 2em shorter)
      marginBottom: (offsets.at(-2) ?? 0) - 18,
    }} onClick={onClick}>
      {/* Cards on top have absolute positioning,
          without interfering with the flow of the rest of the page. */}
      {response.cards.map((card, i) => {
        const isLastCard = i === response.cards.length - 1;
        let content = card.content;
        if (card.action === 'repeat_last' && i > 0) {
          content = response.cards[i-1].content;
        }
        return <CardResponseReading
          key={card.id} card={card}
          content={content}
          isOverlaid={i > 0}
          index={i}
          offset={offsets[i]}
          revealed={response.reveal_count > i}
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
  content: string,
  revealed: boolean,
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
  content, revealed, selectable, selected, likable, onClickLike, likes, likeIcon,
  isOverlaid, index, offset,
  setContentHeight,
}: CardProps) {
  const { player } = useGameContext();
  const overlayClass = isOverlaid ? "overlaid" : "";
  const revealedClass = revealed ? "revealed" : "unrevealed";
  const selectedClass = `${selectable ? "selectable" : ""} ${selected ? "selected" : ""}`;
  const overlayStyle: CSSProperties | undefined = isOverlaid ? {
    position: "absolute",
    top: (offset ?? 0) + (selected ? 4 * (index ?? 0) : 0),
  } : undefined;
  const hasPlayerLike = likes?.find((like) => like.player_uid === player.uid) != null;

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
    } else if (!revealed && setContentHeight) {
      // For unrevealed card, report default size:
      setContentHeight(32);
    }
  }, [contentRef, measure, setContentHeight]);

  function measure(elem: HTMLElement) {
    if (setContentHeight) {
      // Guessing padding size:
      const cardPadding = 16;
      setContentHeight(elem.clientHeight + cardPadding);
      // console.log(`Measured "${card.content}": ${elem.clientHeight}`);
    }
  }

  if (revealed) {
    return (
      <LargeCard className={`card-response response-reading ${selectedClass} ${overlayClass} ${revealedClass}`}
        style={overlayStyle}
      >
        <span ref={contentRef}><CardContent>{content}</CardContent></span>
        {likable && (
          <CardCenterIcon className="like-response-container">
            <div className="like-response-button">
              <IconHeart className="like-response-icon" onClick={onClickLike} />
            </div>
          </CardCenterIcon>
        )}
        {likes && <CardBottomLeft className={hasPlayerLike ? 'has-player-like' : ''}>
          {likes.map((_, i) => (
            <span key={i} className="like">{likeIcon}</span>
          ))}
        </CardBottomLeft>}
      </LargeCard>
    );
  } else {
    return <LargeCard style={overlayStyle}
      className={`card-response response-reading unrevealed ${overlayClass}`}>
      <CardCenterIcon className="reading-unrevealed-icon">
        ?
      </CardCenterIcon>
    </LargeCard>;
  }
}


interface LikeProps {
  response: PlayerResponse
}

/** Returns a custom icon for likes */
function LikeIcon({ response }: LikeProps) {
  for (const card of response.cards) {
    if (card.tags.includes("jew")) {
      return <IconStarOfDavid />;
    }
  }
  for (const card of response.cards) {
    if (card.tags.includes("csgo")) {
      return <IconHeadshot />;
    }
  }
  for (const card of response.cards) {
    if (detectDeer(card.content) || card.tags.includes("deer")) {
      return <Twemoji className="emoji-like">🦌</Twemoji>;
    }
  }
  for (const card of response.cards) {
    if (detectCat(card.content) || card.tags.includes("cat")) {
      return <IconCat className="cat-icon" />;
    }
  }
  for (const card of response.cards) {
    if (detectLenich(card.content)) {
      if (response.cards[0].random_index % 2 == 0) {
        return <Twemoji className="emoji-like">👑</Twemoji>;
      } else {
        return <IconCat className="cat-icon" />;
      }
    }
  }
  return <IconHeart className="heart-icon" />;
}

/** Returns an array with the biggest of the 2 numbers. */
function getMaxItems(localItems: number[], globalItems: number[]): number[] {
  const result = new Array<number>();
  const length = Math.max(localItems.length, globalItems.length);
  for (let i = 0; i < length; i++) {
    const maxItem = Math.max(localItems[i] ?? 0, globalItems[i] ?? 0);
    result[i] = maxItem;
  }
  return result;
}