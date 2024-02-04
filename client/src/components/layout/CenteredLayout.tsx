import { CSSProperties, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode,
  outerClassName?: string,
  outerStyle?: CSSProperties,
  innerClassName?: string,
  innerStyle?: CSSProperties,
}

export function CenteredLayout(
  { children, outerClassName, outerStyle, innerClassName, innerStyle }: LayoutProps
) {
  return (
    <div style={outerStyle}
      className={`layout-center-outer ${outerClassName ?? ""}`}
    >
      <div style={innerStyle}
        className={`layout-center-inner ${innerClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}