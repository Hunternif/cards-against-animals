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
      // TODO: figure out how to do this without height
      height: "100%",
      flex: "1 1 auto",
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