interface LayoutProps extends React.HTMLAttributes<HTMLElement> { }

/** Fills all available space */
export function FillLayout(props: LayoutProps) {
  return (
    <div {...props} className={`layout-fill ${props.className ?? ""}`} />
  );
}