import { copyFields } from "../shared/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string,
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
    {props.icon &&
      <img src={props.icon} style={{ marginLeft: "-0.2em", }} />
    }
    <span style={{ flexGrow: 1 }}>{props.children}</span>
  </button>;
}