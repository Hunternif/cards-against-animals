import React from 'react';

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

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
export function GameLayout({ className, ...props }: Props) {
  const classes = ['layout-game'];
  if (className) classes.push(className);
  return <div {...props} className={classes.join(' ')} />;
}
