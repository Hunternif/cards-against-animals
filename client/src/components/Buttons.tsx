import { ReactNode, useState } from "react";
import { copyFields } from "../shared/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode,
  accent?: boolean,
}

export function GameButton(props: ButtonProps) {
  const className = `${props.accent ? "accent-button " : ""}${props.className}`;
  // Remove new fields when passing props to DOM:
  const propsCopy = copyFields(props, ['accent', 'icon']);
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