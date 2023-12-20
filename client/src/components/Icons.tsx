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

export function IconHamburger() {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height="16" width="14" viewBox="0 0 448 512">
    <path d="M16 132h416c8.8 0 16-7.2 16-16V76c0-8.8-7.2-16-16-16H16C7.2 60 0 67.2 0 76v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16z" />
  </Svg>;
}

export function IconLink() {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height="16" width="16" viewBox="0 0 512 512">
    <path d="M326.6 185.4c59.7 59.8 58.9 155.7 .4 214.6-.1 .1-.2 .3-.4 .4l-67.2 67.2c-59.3 59.3-155.7 59.3-215 0-59.3-59.3-59.3-155.7 0-215l37.1-37.1c9.8-9.8 26.8-3.3 27.3 10.6 .6 17.7 3.8 35.5 9.7 52.7 2 5.8 .6 12.3-3.8 16.6l-13.1 13.1c-28 28-28.9 73.7-1.2 102 28 28.6 74.1 28.7 102.3 .5l67.2-67.2c28.2-28.2 28.1-73.8 0-101.8-3.7-3.7-7.4-6.6-10.3-8.6a16 16 0 0 1 -6.9-12.6c-.4-10.6 3.3-21.5 11.7-29.8l21.1-21.1c5.5-5.5 14.2-6.2 20.6-1.7a152.5 152.5 0 0 1 20.5 17.2zM467.5 44.4c-59.3-59.3-155.7-59.3-215 0l-67.2 67.2c-.1 .1-.3 .3-.4 .4-58.6 58.9-59.4 154.8 .4 214.6a152.5 152.5 0 0 0 20.5 17.2c6.4 4.5 15.1 3.8 20.6-1.7l21.1-21.1c8.4-8.4 12.1-19.2 11.7-29.8a16 16 0 0 0 -6.9-12.6c-2.9-2-6.6-4.9-10.3-8.6-28.1-28.1-28.2-73.6 0-101.8l67.2-67.2c28.2-28.2 74.3-28.1 102.3 .5 27.8 28.3 26.9 73.9-1.2 102l-13.1 13.1c-4.4 4.4-5.8 10.8-3.8 16.6 5.9 17.2 9 35 9.7 52.7 .5 13.9 17.5 20.4 27.3 10.6l37.1-37.1c59.3-59.3 59.3-155.7 0-215z" />
  </Svg>;
}