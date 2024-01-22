import { CSSProperties, useContext } from "react";
import { usePromptVotes, votePrompt } from "../model/turn-api";
import {
  PromptCardInGame,
  VoteChoice
} from "../shared/types";
import { copyFields2 } from "../shared/utils";
import { Downvote, Upvote } from "./CardVotes";
import { ErrorContext } from "./ErrorContext";
import { useGameContext } from "./GameContext";
import {
  CardBottom,
  CardBottomLeft,
  CardBottomRight,
  CardCenterIcon,
  CardContent,
  LargeCard
} from "./LargeCard";

interface PromptCardProps {
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
function KnownPrompt({ card, canVote }: KnownPromptCardProps) {
  const { lobby, turn, player } = useGameContext();
  const { setError } = useContext(ErrorContext);
  const [promptVotes] = usePromptVotes(lobby, turn, card);
  const currentVote = promptVotes?.find((v) => v.player_uid === player.uid);
  const voteClass = currentVote ?
    (currentVote.choice === "yes" ? "upvoted" : "downvoted") : "";

  async function vote(choice?: VoteChoice) {
    await votePrompt(lobby, turn, card, player, choice)
      .catch((e) => setError(e));
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

/** Displays the prompt card and the current judge name below it. */
export function CardPromptWithCzar(props: PromptCardProps) {
  const { judge, isJudge } = useGameContext();
  return <div className="game-card-placeholder" style={containerStyle}>
    <CardPrompt {...props} />
    {(judge && !isJudge) &&
      <div className="prompt-czar-name" style={{
        width: "100%",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}>
        <span className="dimmer">Card Czar:</span> {judge.name}
      </div>
    }
  </div>;
}