import { IconThumbsDown, IconThumbsUp } from "./Icons";

interface VoteProps extends React.HTMLProps<HTMLDivElement> {
  onClick?: () => void,
}

export function Upvote(props: VoteProps) {
  return <div {...props}
    className={`vote-card-icon upvote-card-icon ${props.className ?? ""}`}
    title="Upvote card"
    onClick={(e) => {
      e.stopPropagation();
      if (props.onClick) props.onClick();
    }}>
    <IconThumbsUp width={24} height={24} className="icon" />
  </div>;
}

export function Downvote(props: VoteProps) {
  return <div {...props}
    className={`vote-card-icon downvote-card-icon ${props.className ?? ""}`}
    title="Downvote card"
    onClick={(e) => {
      e.stopPropagation();
      if (props.onClick) props.onClick();
    }}>
    <IconThumbsDown width={24} height={24} className="icon" />
  </div>;
}