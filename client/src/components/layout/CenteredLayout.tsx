import { CSSProperties, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode,
  className?: string,
  style?: CSSProperties,
}

export function CenteredLayout({ children, className, style }: LayoutProps) {
  return (
    <div style={{
      height: "100%",
      justifyContent: "center",
      display: "flex",
    }}
      className={className}
    >
      <div style={{
        margin: "auto",
        ...style
      }}>
        {children}
      </div>
    </div>
  );
}