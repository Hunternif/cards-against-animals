import { CSSProperties } from "react";
import { PlayerInLobby, PromptCardInGame } from "../shared/types";
import { LargeCard, CardContent, CardBottomRight, CardCenterIcon } from "./LargeCard";

interface PromptCardProps {
  /** Undefined while the judge hasn't picked a prompt yet */
  card: PromptCardInGame | undefined | null,
}

/** Formats gaps to be longer. */
function formatPrompt(text: string): string {
  return text.replace(/_+/g, "______");
}

export function CardPrompt({ card }: PromptCardProps) {
  return (
    <LargeCard className="card-prompt">
      {card ? (<>
        <CardContent>{formatPrompt(card.content)}</CardContent>
        {card.pick > 1 && (
          <CardBottomRight>
            <PromptCardPick pick={card.pick} />
          </CardBottomRight>
        )}
      </>) : (
        <CardCenterIcon className="prompt-unknown-icon">
          ?
        </CardCenterIcon>
      )}
    </LargeCard>
  );
}

const containerStyle: CSSProperties = {
  height: "auto",
}

interface PromptWithCzarProps {
  /** Undefined while the judge hasn't picked a prompt yet */
  card: PromptCardInGame | undefined | null,
  judge?: PlayerInLobby | null,
}

/** Displays the prompt card and the current judge name below it. */
export function CardPromptWithCzar({ card, judge }: PromptWithCzarProps) {
  return <div className="game-card-placeholder" style={containerStyle}>
    <CardPrompt card={card} />
    {judge &&
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

interface PickProps {
  pick: number,
}

function PromptCardPick({ pick }: PickProps) {
  return <>
    PICK
    <div className="prompt-pick-number" style={{
      textAlign: "center",
      borderRadius: "50%",
      width: "1rem",
      height: "1rem",
      lineHeight: "1rem",
      marginLeft: "0.5em",
      backgroundColor: "#fff",
      color: "#000",
      fontWeight: "bold",
    }}>
      {pick}
    </div>
  </>;
}