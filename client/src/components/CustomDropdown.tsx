import React, { CSSProperties, MouseEventHandler, ReactNode, useMemo } from "react";
import { Dropdown } from "react-bootstrap";

interface ToggleProps {
  onClick: MouseEventHandler,
  children: ReactNode,
}

function customToggle(
  className?: string, style?: CSSProperties, showArrow?: boolean,
) {
  const arrowClass = showArrow ? "dropdown-toggle " : "";
  return React.forwardRef<HTMLAnchorElement, ToggleProps>(
    ({ children, onClick }, ref) => (
      <span
        ref={ref}
        onClick={(e) => {
          e.preventDefault();
          onClick(e);
        }}
        className={`${arrowClass}${className ?? ""}`}
        style={{
          cursor: "pointer",
          ...style
        }}
      >
        {children}
      </span>
    ));
}

interface Props {
  className?: string,
  style?: CSSProperties,
  toggle: ReactNode,
  toggleClassName?: string,
  toggleStyle?: CSSProperties,
  showArrow?: boolean,
  children: ReactNode,
}

export function CustomDropdown({
  className, style, toggle, toggleClassName, toggleStyle, showArrow, children,
}: Props) {
  const toggleRef = useMemo(() =>
    customToggle(toggleClassName, toggleStyle, showArrow),
    [toggleClassName, toggleStyle, showArrow]);
  return (
    <Dropdown style={style} className={className}>
      <Dropdown.Toggle as={toggleRef}>{toggle}</Dropdown.Toggle>
      {children}
    </Dropdown>
  );
}