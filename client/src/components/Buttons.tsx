import { ReactNode } from "react";
import { copyFields } from "../shared/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode,
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
  const className = `${lightClass}${secondaryClass}${accentClass}${smallClass}${props.className}`;
  // Remove new fields when passing props to DOM:
  const propsCopy = copyFields(props, ['accent', 'icon', 'secondary', 'small']);
  return <button {...propsCopy}
    className={className}
    style={{
      display: "flex",
      textAlign: "center",
      alignItems: "center",
      ...props.style,
    }}
  >
    <span style={{ display: "flex" }}>
      {props.icon}
    </span>
    <span style={{ flexGrow: 1 }}>{props.children}</span>
  </button>;
}