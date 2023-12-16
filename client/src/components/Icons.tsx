import { ReactElement, useState } from "react";

interface IconProps {
  height?: number | string;
  width?: number | string;
  viewBox?: string;
  children: ReactElement<SVGPathElement>,
}

/** Sets color from css font color*/
function Svg({ height, width, viewBox, children }: IconProps) {
  const [ref, setRef] = useState<Element | null>(null);
  // Get current font color from CSS and apply it to the SVG path:
  const color = ref ? window.getComputedStyle(ref).getPropertyValue("color") : undefined;
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      height={height} width={width} viewBox={viewBox}
      ref={(elem) => setRef(elem)}
      style={{ fill: color }}>
      {children}
    </svg>
  );
}

export function IconPlay() {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height="16" width="14" viewBox="0 0 448 512">
    <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
  </Svg>;
}
