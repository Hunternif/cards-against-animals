import { forwardRef } from "react";
import { FillLayout } from "./layout/FillLayout";
import { Twemoji, TwemojiWithRef } from "./Twemoji";

interface ComponentProps extends React.HTMLAttributes<HTMLElement> { }

export function LargeCard(props: ComponentProps) {
  return (
    <div {...props}
      className={`game-card ${props.className ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        flexShrink: "0",
        ...props.style,
      }} />
  );
}

export function CardCenterIcon(props: ComponentProps) {
  return <FillLayout {...props}
    className={`card-center-icon ${props.className ?? ""}`} />;
}

export function CardContent(props: ComponentProps) {
  return <Twemoji {...props}
    className={`card-content ${props.className ?? ""}`} />;
}

export const CardContentWithRef = forwardRef(
  (props: ComponentProps, ref: React.Ref<HTMLSpanElement>) =>
    <TwemojiWithRef ref={ref} {...props}
      className={`card-content ${props.className ?? ""}`} />
);

export function CardBottomLeft(props: ComponentProps) {
  return <div {...props} className={`card-bottom-left ${props.className ?? ""}`} />;
}

export function CardBottomRight(props: ComponentProps) {
  return <div {...props} className={`card-bottom-right ${props.className ?? ""}`} />;
}
