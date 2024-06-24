interface Props extends React.HTMLAttributes<HTMLElement> {
  scrollLight?: boolean;
  scrollDark?: boolean;
}

export function ScrollContainer({
  scrollLight,
  scrollDark,
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
  return <div {...props} className={classes.join(' ')} />;
}
