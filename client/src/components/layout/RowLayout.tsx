import { CSSProperties, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode,
  className?: string,
  style?: CSSProperties,
}

/** Horizontal row that takes 100% height */
export function RowLayout({ children, className, style }: LayoutProps) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "nowrap",
      height: "100%",
      ...style
    }}
      className={className}
    >
      {children}
    </div>
  );
}