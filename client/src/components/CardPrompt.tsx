import { User } from "firebase/auth";
import { CSSProperties, useContext } from "react";
import { usePromptVotes, votePrompt } from "../model/turn-api";
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  PromptCardInGame,
  VoteChoice
} from "../shared/types";
import { copyFields2 } from "../shared/utils";
import { Downvote, Upvote } from "./CardVotes";
import {
  CardBottom,
  CardBottomLeft,
  CardBottomRight,
  CardCenterIcon,
  CardContent,
  LargeCard
} from "./LargeCard";
import { ErrorContext } from "./ErrorContext";

interface PromptCardProps {
  lobby: GameLobby,
  turn: GameTurn,
  // TODO: current player must be non-null
  currentPlayer?: PlayerInLobby,
  /** Undefined while the judge hasn't picked a prompt yet */
  card: PromptCardInGame | undefined | null,
  canVote?: boolean,
}

/** Formats gaps to be longer. */
function formatPrompt(text: string): string {
  return text.replace(/_+/g, "______");
}

export function CardPrompt(props: PromptCardProps) {
  if (props.card) {
    const newProps = copyFields2(props, { card: props.card });
    return <KnownPrompt {...newProps} />;
  } else {
    return <UnknownPrompt />;
  }
}

interface KnownPromptCardProps extends PromptCardProps {
  card: PromptCardInGame,
}

/** Prompt that exists (has been chosen and loaded). */
function KnownPrompt({
  lobby, turn, currentPlayer, card, canVote,
}: KnownPromptCardProps) {
  const { setError } = useContext(ErrorContext);
  const [promptVotes] = usePromptVotes(lobby, turn, card);
  const currentVote = promptVotes?.find((v) => v.player_uid === currentPlayer?.uid);
  const voteClass = currentVote ?
    (currentVote.choice === "yes" ? "upvoted" : "downvoted") : "";

  async function vote(choice?: VoteChoice) {
    if (currentPlayer) {
      await votePrompt(lobby, turn, card, currentPlayer, choice)
        .catch((e) => setError(e));
    }
  }

  async function handleUpvote() {
    if (currentVote?.choice === "yes") {
      // toggle to cancel the previous upvote:
      await vote(undefined);
    } else {
      await vote("yes");
    }
  }
  async function handleDownvote() {
    if (currentVote?.choice === "no") {
      // toggle to cancel the previous downvote:
      await vote(undefined);
    } else {
      await vote("no");
    }
  }
  return (
    <LargeCard className={`card-prompt ${voteClass}`}>
      <CardContent>{formatPrompt(card.content)}</CardContent>
      {(canVote || card.pick > 1) && (
        <CardBottom>
          {canVote && (
            <CardBottomLeft className="prompt-voting">
              <Upvote onClick={handleUpvote} />
              <Downvote onClick={handleDownvote} />
            </CardBottomLeft>
          )}
          {card.pick > 1 && (
            <CardBottomRight className="prompt-pick">
              PICK
              <div className="prompt-pick-number">{card.pick}</div>
            </CardBottomRight>
          )}
        </CardBottom>
      )}
    </LargeCard>
  );
}

/** Prompt that hasn't been chosen or hasn't loaded, shows a big "?". */
function UnknownPrompt() {
  return (
    <LargeCard className="card-prompt">
      <CardCenterIcon className="prompt-unknown-icon">
        ?
      </CardCenterIcon>
    </LargeCard>
  );
}

const containerStyle: CSSProperties = {
  height: "auto",
}

interface PromptWithCzarProps extends PromptCardProps {
  judge?: PlayerInLobby | null,
}

/** Displays the prompt card and the current judge name below it. */
export function CardPromptWithCzar(props: PromptWithCzarProps) {
  return <div className="game-card-placeholder" style={containerStyle}>
    <CardPrompt {...props} />
    {props.judge &&
      <div className="prompt-czar-name" style={{
        width: "100%",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}>
        <span className="dimmer">Card Czar:</span> {props.judge.name}
      </div>
    }
  </div>;
}