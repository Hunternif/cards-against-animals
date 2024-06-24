import { Twemoji } from "../../../components/Twemoji";
import { FillLayout } from "../../../components/layout/FillLayout";
import { isOnlyEmojis } from "../../../api/deck/deck-parser";

interface ComponentProps extends React.HTMLAttributes<HTMLElement> { }

export function LargeCard(props: ComponentProps) {
  return (
    <div {...props} className={`game-card ${props.className ?? ""}`} />
  );
}

export function CardCenterIcon(props: ComponentProps) {
  return <FillLayout {...props}
    className={`card-center-icon ${props.className ?? ""}`} />;
}

export function CardContent(props: ComponentProps) {
  const content = props.children?.toString() ?? "";
  const emojiClass = isOnlyEmojis(content) ? "emoji-only " : "";
  return <Twemoji {...props}
    className={`card-content ${emojiClass}${props.className ?? ""}`} />;
}

export function CardBottom(props: ComponentProps) {
  return <div {...props} className={`card-bottom ${props.className ?? ""}`} />;
}

export function CardBottomLeft(props: ComponentProps) {
  return <div {...props} className={`card-bottom-left ${props.className ?? ""}`} />;
}

export function CardBottomRight(props: ComponentProps) {
  return <div {...props} className={`card-bottom-right ${props.className ?? ""}`} />;
}
