import { ReactNode } from "react";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string,
  accent?: boolean,
}

export function GameButton(props: ButtonProps) {
  const className = `${props.accent ? "accent-button " : ""}${props.className}`;
  return <button {...props}
    className={className}
    style={{
      display: "flex",
      textAlign: "center",
      alignItems: "center",
      height: "3rem",
      ...props.style,
    }}
  >
    {props.icon &&
      <img src={props.icon} style={{ marginLeft: "-0.2em", }} />
    }
    <span style={{ flexGrow: 1 }}>{props.children}</span>
  </button>;
}