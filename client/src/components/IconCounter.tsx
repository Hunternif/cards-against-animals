import { ReactNode } from "react";
import { copyFields } from "@shared/utils";

interface CounterProps extends React.HTMLProps<HTMLSpanElement> {
  icon: ReactNode;
  count: number;
}

export function IconCounter(props: CounterProps) {
  // Remove new fields when passing props to DOM:
  const propsCopy = copyFields(props, ["icon", "count"]);
  return (
    <span {...propsCopy} className={`icon-counter ${props.className ?? ""}`}>
      {props.icon}
      <span className="count">{props.count}</span>
    </span>
  );
}