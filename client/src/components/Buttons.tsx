import { ReactNode, useState } from "react";
import { copyFields } from "../shared/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode,
  accent?: boolean,
  secondary?: boolean,
}

export function GameButton(props: ButtonProps) {
  const accentClass = props.accent ? "accent-button " : "";
  const secondaryClass = props.secondary ? "secondary-button " : "";
  const className = `${accentClass}${secondaryClass}${props.className}`;
  // Remove new fields when passing props to DOM:
  const propsCopy = copyFields(props, ['accent', 'icon', 'secondary']);
  return <button {...propsCopy}
    className={className}
    style={{
      display: "flex",
      textAlign: "center",
      alignItems: "center",
      height: "3rem",
      ...props.style,
    }}
  >
    <span style={{
      display: "flex",
      marginLeft: "-0.6em",
      marginRight: "0.6em",
    }}>
      {props.icon}
    </span>
    <span style={{ flexGrow: 1 }}>{props.children}</span>
  </button>;
}