import { ReactNode } from "react";
import { copyFields } from "../shared/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconLeft?: ReactNode,
  iconRight?: ReactNode,
  accent?: boolean,
  secondary?: boolean,
  light?: boolean,
  small?: boolean,
}

export function GameButton(props: ButtonProps) {
  const accentClass = props.accent ? "accent-button " : "";
  const lightClass = props.light ? "light-button " : "";
  const secondaryClass = props.secondary ? "secondary-button " : "";
  const smallClass = props.small ? "small-button " : "";
  const className = `game-button ${lightClass}${secondaryClass}${accentClass}${smallClass}${props.className ?? ""}`;
  // Remove new fields when passing props to DOM:
  const propsCopy = copyFields(props, ['accent', 'iconLeft', 'iconRight', 'secondary', 'small', 'light']);
  return <button {...propsCopy}
    className={className}
  >
    {props.iconLeft && <span style={{ display: "flex" }}>
      {props.iconLeft}
    </span>}
    <span style={{ flexGrow: 1 }}>{props.children}</span>
    {props.iconRight && <span style={{ display: "flex" }}>
      {props.iconRight}
    </span>}
  </button>;
}

export function InlineButton(props: React.HTMLProps<HTMLSpanElement>) {
  return <div className="inline-button-block">
    <span {...props} className={`inline-button ${props.className ?? ""}`} />
  </div>;
}