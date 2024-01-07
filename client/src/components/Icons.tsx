import { ReactElement, useState } from "react";

interface SvgProps
  extends React.SVGAttributes<SVGSVGElement> { }

/** Sets color from css font color*/
function Svg(props: SvgProps) {
  const [ref, setRef] = useState<Element | null>(null);
  // Get current font color from CSS and apply it to the SVG path:
  const color = ref ? window.getComputedStyle(ref).getPropertyValue("color") : undefined;
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={(elem) => setRef(elem)}
      style={{ fill: color }} />
  );
}

interface IconSvgProps
  extends React.SVGAttributes<SVGSVGElement> {
  height?: number | string;
  width?: number | string;
}

export function IconPlay({ width, height }: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height={height ?? 16} width={width ?? 14} viewBox="0 0 448 512">
    <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
  </Svg>;
}

export function IconHamburger({ width, height }: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height={height ?? 16} width={width ?? 14} viewBox="0 0 448 512">
    <path d="M16 132h416c8.8 0 16-7.2 16-16V76c0-8.8-7.2-16-16-16H16C7.2 60 0 67.2 0 76v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16z" />
  </Svg>;
}

export function IconLink({ width, height }: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height={height ?? 16} width={width ?? 16} viewBox="0 0 512 512">
    <path d="M326.6 185.4c59.7 59.8 58.9 155.7 .4 214.6-.1 .1-.2 .3-.4 .4l-67.2 67.2c-59.3 59.3-155.7 59.3-215 0-59.3-59.3-59.3-155.7 0-215l37.1-37.1c9.8-9.8 26.8-3.3 27.3 10.6 .6 17.7 3.8 35.5 9.7 52.7 2 5.8 .6 12.3-3.8 16.6l-13.1 13.1c-28 28-28.9 73.7-1.2 102 28 28.6 74.1 28.7 102.3 .5l67.2-67.2c28.2-28.2 28.1-73.8 0-101.8-3.7-3.7-7.4-6.6-10.3-8.6a16 16 0 0 1 -6.9-12.6c-.4-10.6 3.3-21.5 11.7-29.8l21.1-21.1c5.5-5.5 14.2-6.2 20.6-1.7a152.5 152.5 0 0 1 20.5 17.2zM467.5 44.4c-59.3-59.3-155.7-59.3-215 0l-67.2 67.2c-.1 .1-.3 .3-.4 .4-58.6 58.9-59.4 154.8 .4 214.6a152.5 152.5 0 0 0 20.5 17.2c6.4 4.5 15.1 3.8 20.6-1.7l21.1-21.1c8.4-8.4 12.1-19.2 11.7-29.8a16 16 0 0 0 -6.9-12.6c-2.9-2-6.6-4.9-10.3-8.6-28.1-28.1-28.2-73.6 0-101.8l67.2-67.2c28.2-28.2 74.3-28.1 102.3 .5 27.8 28.3 26.9 73.9-1.2 102l-13.1 13.1c-4.4 4.4-5.8 10.8-3.8 16.6 5.9 17.2 9 35 9.7 52.7 .5 13.9 17.5 20.4 27.3 10.6l37.1-37.1c59.3-59.3 59.3-155.7 0-215z" />
  </Svg>;
}

export function IconThumbsDown({ width, height }: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height={height ?? 16} width={width ?? 16} viewBox="0 0 512 512">
    <path d="M313.4 479.1c26-5.2 42.9-30.5 37.7-56.5l-2.3-11.4c-5.3-26.7-15.1-52.1-28.8-75.2H464c26.5 0 48-21.5 48-48c0-18.5-10.5-34.6-25.9-42.6C497 236.6 504 223.1 504 208c0-23.4-16.8-42.9-38.9-47.1c4.4-7.3 6.9-15.8 6.9-24.9c0-21.3-13.9-39.4-33.1-45.6c.7-3.3 1.1-6.8 1.1-10.4c0-26.5-21.5-48-48-48H294.5c-19 0-37.5 5.6-53.3 16.1L202.7 73.8C176 91.6 160 121.6 160 153.7V192v48 24.9c0 29.2 13.3 56.7 36 75l7.4 5.9c26.5 21.2 44.6 51 51.2 84.2l2.3 11.4c5.2 26 30.5 42.9 56.5 37.7zM32 384H96c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H32C14.3 96 0 110.3 0 128V352c0 17.7 14.3 32 32 32z" />
  </Svg>;
}

export function IconTrash(props: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg {...props} height={props.height ?? 16} width={props.width ?? 14} viewBox="0 0 448 512">
    <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.7 23.7 0 0 0 -21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0 -16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" />
  </Svg>;
}

export function IconArowLeft(props: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg {...props} height={props.height ?? 16} width={props.width ?? 14} viewBox="0 0 448 512">
    <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8 .4 34.3z"/>
  </Svg>;
}

export function IconPerson(props: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg {...props} height={props.height ?? 16} width={props.width ?? 14} viewBox="0 0 448 512">
    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/>
  </Svg>;
}