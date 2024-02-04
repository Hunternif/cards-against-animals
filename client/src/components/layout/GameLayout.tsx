import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> { }

/**
 * A simple container, its styling is defined in CSS files.
 * Renders a block in the center of the screen.
 * The intended structure is this:
 * ```
 * <header />
 * <section />
 * <footer />
 * ```
 */
export function GameLayout(props: Props) {
  return <div {...props} className={`layout-game ${props.className ?? ""}`} />;
}