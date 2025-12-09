interface Props extends React.HTMLAttributes<HTMLElement> {
  scrollLight?: boolean;
  scrollDark?: boolean;
  horizontal?: boolean;
  /** Hide the scrollbar completely (carousel style) */
  hideScrollbar?: boolean;
  /** Show a more visible/prominent scrollbar */
  visibleScrollbar?: boolean;
}

export function ScrollContainer({
  scrollLight,
  scrollDark,
  horizontal,
  hideScrollbar,
  visibleScrollbar,
  className,
  ...props
}: Props) {
  const classes = [
    'layout-scroll-container',
    'miniscrollbar',
    'miniscrollbar-auto',
  ];
  if (className) classes.push(className);
  if (scrollLight) classes.push('miniscrollbar-light');
  if (scrollDark) classes.push('miniscrollbar-dark');
  if (horizontal) classes.push('horizontal-scroll-container');
  if (hideScrollbar) classes.push('miniscrollbar-hidden');
  if (visibleScrollbar) classes.push('miniscrollbar-visible');
  return <div {...props} className={classes.join(' ')} />;
}
