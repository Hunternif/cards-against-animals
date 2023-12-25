import { FillLayout } from "./layout/FillLayout";

interface ComponentProps extends React.HTMLAttributes<HTMLElement> { }

export function LargeCard(props: ComponentProps) {
  return (
    <div {...props}
      className={`game-card ${props.className}`}
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
    className={`card-center-icon ${props.className}`}
    style={{
      display: "flex",
      flexWrap: "wrap",
      position: "absolute",
      top: 0,
      left: 0,
      alignContent: "center",
      justifyContent: "center",
      userSelect: "none",
      pointerEvents: "none",
      ...props.style,
    }} />;
}

export function CardContent(props: ComponentProps) {
  return <span {...props} style={{
    whiteSpace: "pre-line",
    ...props.style,
  }} />;
}

export function CardBottomRight(props: ComponentProps) {
  return <div {...props} style={{
    display: "flex",
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: "auto",
    marginLeft: "auto",
    ...props.style,
  }} />;
}
