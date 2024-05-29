import { ReactNode } from "react";
import {
  ControlProps,
  getControlStyle,
  stripControlProps,
} from "./FormControls";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ControlProps {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function GameButton({ iconLeft, iconRight, ...props }: ButtonProps) {
  const controlClass = getControlStyle(props);
  const buttonProps = stripControlProps(props);
  return (
    <button {...buttonProps} className={`game-button ${controlClass}`}>
      {iconLeft && <span style={{ display: "flex" }}>{iconLeft}</span>}
      <span style={{ flexGrow: 1 }}>{props.children}</span>
      {iconRight && <span style={{ display: "flex" }}>{iconRight}</span>}
    </button>
  );
}

export function InlineButton(props: React.HTMLProps<HTMLSpanElement>) {
  return (
    <div className="inline-button-block">
      <span {...props} className={`inline-button ${props.className ?? ""}`} />
    </div>
  );
}
