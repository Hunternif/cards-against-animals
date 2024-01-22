interface LayoutProps extends React.HTMLAttributes<HTMLElement> { }

/** Fills all available space */
export function FillLayout(props: LayoutProps) {
  return (
    <div {...props} style={{
      flex: "1 1 auto",
      width: "100%",
      height: "100%",
      ...props.style
    }} />
  );
}