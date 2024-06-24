interface LayoutProps extends React.HTMLAttributes<HTMLElement> {}

/** Horizontal row that takes 100% height */
export function ColumnLayout({ className, ...props }: LayoutProps) {
  const classes = ['layout-column'];
  if (className) classes.push(className);
  return <div {...props} className={classes.join(' ')} />;
}
