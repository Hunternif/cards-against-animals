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

export function IconPlay() {
  const [ref, setRef] = useState<Element | null>(null);
  // Get current font color from CSS and apply it to the SVG path:
  const color = ref ? window.getComputedStyle(ref).getPropertyValue("color") : undefined;
  // From Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  return <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512"
    ref={(elem) => setRef(elem)}>
    <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
      fill={color} />
  </svg>
}