import { CSSProperties, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode,
  className?: string,
  style?: CSSProperties,
}

/** Fills all available space */
export function FillLayout({ children, className, style }: LayoutProps) {
  return (
    <div style={{
      flex: "1 1 auto",
      width: "100%",
      height: "100%",
      ...style
    }}
      className={className}
    >
      {children}
    </div>
  );
}