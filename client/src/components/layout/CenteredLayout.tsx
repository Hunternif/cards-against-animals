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
    <div style={{
      height: "100%",
      justifyContent: "center",
      display: "flex",
      ...outerStyle,
    }}
      className={outerClassName}
    >
      <div style={{
        margin: "auto",
        ...innerStyle
      }}
        className={innerClassName}
      >
        {children}
      </div>
    </div>
  );
}