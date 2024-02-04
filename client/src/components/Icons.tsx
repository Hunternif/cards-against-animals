import { useState } from "react";
import csgo_headshot from "../assets/icons/csgo_headshot.png";

interface SvgProps
  extends React.SVGAttributes<SVGSVGElement> {
  colorStroke?: boolean,
}

interface HtmlProps extends React.HTMLAttributes<HTMLElement> { }

/** Sets color from css font color*/
function Svg(props: SvgProps) {
  const [ref, setRef] = useState<Element | null>(null);
  // Get current font color from CSS and apply it to the SVG path:
  const color = ref ? window.getComputedStyle(ref).getPropertyValue("color") : undefined;
  const style = props.colorStroke ? { stroke: color, fill: "none" } : { fill: color };
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={(elem) => setRef(elem)}
      style={style} />
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

export function IconThumbsUp({ width, height }: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg height={height ?? 16} width={width ?? 16} viewBox="0 0 512 512">
    <path d="M313.4 32.9c26 5.2 42.9 30.5 37.7 56.5l-2.3 11.4c-5.3 26.7-15.1 52.1-28.8 75.2H464c26.5 0 48 21.5 48 48c0 18.5-10.5 34.6-25.9 42.6C497 275.4 504 288.9 504 304c0 23.4-16.8 42.9-38.9 47.1c4.4 7.3 6.9 15.8 6.9 24.9c0 21.3-13.9 39.4-33.1 45.6c.7 3.3 1.1 6.8 1.1 10.4c0 26.5-21.5 48-48 48H294.5c-19 0-37.5-5.6-53.3-16.1l-38.5-25.7C176 420.4 160 390.4 160 358.3V320 272 247.1c0-29.2 13.3-56.7 36-75l7.4-5.9c26.5-21.2 44.6-51 51.2-84.2l2.3-11.4c5.2-26 30.5-42.9 56.5-37.7zM32 192H96c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V224c0-17.7 14.3-32 32-32z" />
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
    <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8 .4 34.3z" />
  </Svg>;
}

export function IconPerson(props: IconSvgProps) {
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg {...props} height={props.height ?? 16} width={props.width ?? 14} viewBox="0 0 448 512">
    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z" />
  </Svg>;
}

export function IconPersonInline() {
  return <IconPerson className="person-icon-inline" />;
}

export function IconPersonInlineSmall() {
  return <IconPerson width="0.9em" height="0.9em" className="person-icon-inline-small" />;
}

export function IconStar(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 24} width={props.width ?? 24} viewBox="0 0 24 24">
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
  </Svg>;

  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  // return <Svg {...props} height={props.height ?? 16} width={props.width ?? 18} viewBox="0 0 576 512">
  //   <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
  // </Svg>;
}

export function IconStarInline() {
  return <IconStar width="1.15em" height="1.15em" className="star-icon-inline" />;
}

export function IconXCircle(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 24} width={props.width ?? 24} viewBox="0 -960 960 960">
    <path d="m480-424 116 116q11 11 28 11t28-11q11-11 11-28t-11-28L536-480l116-116q11-11 11-28t-11-28q-11-11-28-11t-28 11L480-536 364-652q-11-11-28-11t-28 11q-11 11-11 28t11 28l116 116-116 116q-11 11-11 28t11 28q11 11 28 11t28-11l116-116Zm0 344q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
  </Svg>;
}

export function IconXCircleFilled(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 24} width={props.width ?? 24} viewBox="0 -960 960 960">
    <path d="m480-424 116 116q11 11 28 11t28-11q11-11 11-28t-11-28L536-480l116-116q11-11 11-28t-11-28q-11-11-28-11t-28 11L480-536 364-652q-11-11-28-11t-28 11q-11 11-11 28t11 28l116 116-116 116q-11 11-11 28t11 28q11 11 28 11t28-11l116-116Zm0 344q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
  </Svg>;
}

export function IconCheck(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 24} width={props.width ?? 24} viewBox="0 -960 960 960">
    <path d="M382-208 122-468l90-90 170 170 366-366 90 90-456 456Z" />
  </Svg>;
}

export function IconHeart(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 20} width={props.width ?? 20} viewBox="0 -960 960 960">
    <path d="m480-170.925-36.153-32.691q-98.461-88.231-162.5-150.577-64.038-62.346-100.576-109.923-36.539-47.577-50.654-86.269-14.116-38.692-14.116-78.615 0-80.153 55.423-135.576Q226.847-819.999 307-819.999q49.385 0 95 23.501 45.615 23.5 78 67.269 32.385-43.769 78-67.269 45.615-23.501 95-23.501 80.153 0 135.576 55.423Q843.999-709.153 843.999-629q0 39.923-13.616 77.615-13.615 37.692-50.154 84.769-36.538 47.077-100.884 110.423-64.346 63.346-165.192 154.577L480-170.925Z" />
  </Svg>;
}

export function IconHeartInline() {
  return <IconHeart width="1.1em" height="1.1em" className="heart-icon-inline" />;
}

export function IconCat(props: IconSvgProps) {
  // Created by Bellowen, from the Noun Project https://thenounproject.com/icon/black-cat-5146647/
  return <Svg {...props} height={props.height ?? 20} width={props.width ?? 20} viewBox="0 0 75 60">
    <circle cx="25.4331226" cy="33.1546974" r="4.6503067" />
    <circle cx="49.4743843" cy="33.1546974" r="4.6503067" />
    <path d="M69.1988678,41.2200813c-2.8612061-0.7600098-5.3446007-0.8387451-7.4699059-0.5587769  c0.4899902-1.7268066,0.7533569-3.5331421,0.7533569-5.3942261c0-1.3352051-0.1414185-2.6404419-0.3980713-3.9104614  L59.8546333,5.3813977l-11.6939697,9.8945923c-3.24646-1.3598633-6.8753052-2.1231689-10.7069092-2.1231689  c-3.7972412,0-7.3945332,0.7509766-10.6187153,2.0880127l-11.6524048-9.859436l-2.1503296,25.0512695  c-0.3930664,1.5567017-0.6071167,3.1730347-0.6071167,4.8344116c0,1.8613281,0.2634277,3.6679077,0.75354,5.3949585  c-2.1255493-0.2803955-4.6090698-0.2019653-7.4700928,0.5580444c-0.5336914,0.1425781-0.8515625,0.6904297-0.7094727,1.2236328  c0.1411133,0.5341797,0.6894531,0.8486328,1.2231445,0.7099609c3.0484619-0.8114014,5.6098022-0.770813,7.6976929-0.345459  c0.6101074,1.4860229,1.3989258,2.8952026,2.3372803,4.2133789c-4.265686,0.4698486-6.7080078,2.6924438-6.8484497,2.8234863  C9.0079517,50.223011,8.989397,50.8519173,9.3648853,51.254261c0.1962891,0.2109375,0.4628906,0.3173828,0.730957,0.3173828  c0.2436523,0,0.4882813-0.0888672,0.6806641-0.2666016c0.1298218-0.1201782,2.6245117-2.3500366,7.0109863-2.368103  c4.5829468,5.1401367,11.6856689,8.444458,19.6662617,8.444458c7.9807129,0,15.0834351-3.3043823,19.6664429-8.4447021  c4.3858643,0.0178833,6.8801231,2.2466431,7.0103111,2.3683472c0.1933594,0.1796875,0.4375,0.2685547,0.6826172,0.2685547  c0.265625,0,0.53125-0.1054688,0.7285156-0.3144531c0.3779297-0.4023438,0.359375-1.0351563-0.0429688-1.4140625  c-0.1394653-0.1311035-2.5816002-2.3529663-6.8491783-2.8224487c0.9380493-1.3175049,1.7267456-2.7260132,2.336792-4.2112427  c2.088501-0.4260864,4.6504478-0.4677734,7.6989098,0.3422852c0.5341797,0.1386719,1.0820313-0.1767578,1.2236328-0.7099609  S69.7330475,41.3626595,69.1988678,41.2200813z M25.4331226,43.0695076c-5.4758301,0-9.914856-4.4390259-9.914856-9.914856  s4.4390259-9.914856,9.914856-9.914856s9.9148579,4.4390259,9.9148579,9.914856S30.9089527,43.0695076,25.4331226,43.0695076z   M39.5595894,33.1546516c0-5.4758301,4.4390259-9.914856,9.9147949-9.914856c5.4758301,0,9.914856,4.4390259,9.914856,9.914856  s-4.4390259,9.914856-9.914856,9.914856C43.9986153,43.0695076,39.5595894,38.6304817,39.5595894,33.1546516z" />
  </Svg >;
}

export function IconQuestion(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  // return <Svg {...props} height={props.height ?? 24} width={props.width ?? 24} viewBox="0 -960 960 960">
  //   <path d="M479.56-255.386q17.132 0 28.94-11.829 11.807-11.829 11.807-28.961 0-17.132-11.829-28.939-11.829-11.808-28.961-11.808-17.132 0-28.939 11.829-11.808 11.829-11.808 28.961 0 17.132 11.829 28.94 11.829 11.807 28.961 11.807Zm-28.329-143.23h56.307q.769-29.538 8.654-47.192 7.884-17.653 38.269-46.807 26.384-26.385 40.423-48.731 14.038-22.346 14.038-52.779 0-51.643-37.114-80.682-37.115-29.038-87.808-29.038-50.076 0-82.884 26.731-32.807 26.73-46.807 62.96l51.383 20.615q7.308-19.923 25-38.807 17.693-18.885 52.539-18.885 35.462 0 52.423 19.424 16.962 19.423 16.962 42.731 0 20.384-11.616 37.307-11.615 16.923-29.615 32.693-39.384 35.538-49.769 56.692-10.385 21.154-10.385 63.768Zm28.836 298.615q-78.836 0-148.204-29.92-69.369-29.92-120.682-81.21-51.314-51.291-81.247-120.629-29.933-69.337-29.933-148.173t29.92-148.204q29.92-69.369 81.21-120.682 51.291-51.314 120.629-81.247 69.337-29.933 148.173-29.933t148.204 29.92q69.369 29.92 120.682 81.21 51.314 51.291 81.247 120.629 29.933 69.337 29.933 148.173t-29.92 148.204q-29.92 69.369-81.21 120.682-51.291 51.314-120.629 81.247-69.337 29.933-148.173 29.933ZM480-160q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
  // </Svg>;
  // Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com
  // License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.
  return <Svg {...props} height={props.height ?? 16} width={props.width ?? 16} viewBox="0 0 512 512">
    <path d="M256 8C119 8 8 119.1 8 256c0 137 111 248 248 248s248-111 248-248C504 119.1 393 8 256 8zm0 448c-110.5 0-200-89.4-200-200 0-110.5 89.5-200 200-200 110.5 0 200 89.5 200 200 0 110.5-89.4 200-200 200zm107.2-255.2c0 67.1-72.4 68.1-72.4 92.9V300c0 6.6-5.4 12-12 12h-45.6c-6.6 0-12-5.4-12-12v-8.7c0-35.7 27.1-50 47.6-61.5 17.6-9.8 28.3-16.5 28.3-29.6 0-17.2-22-28.7-39.8-28.7-23.2 0-33.9 11-48.9 30-4.1 5.1-11.5 6.1-16.7 2.1l-27.8-21.1c-5.1-3.9-6.3-11.1-2.6-16.4C184.8 131.5 214.9 112 261.8 112c49.1 0 101.5 38.3 101.5 88.8zM298 368c0 23.2-18.8 42-42 42s-42-18.8-42-42 18.8-42 42-42 42 18.8 42 42z" />
  </Svg>;
}

export function IconQuestionInline() {
  return <IconQuestion width="1em" height="1em" className="icon-info-inline" />;
}

export function IconChevronDown(props: IconSvgProps) {
  // From Google Fonts, Material Icons: https://fonts.google.com/icons
  return <Svg {...props} height={props.height ?? 20} width={props.width ?? 20} viewBox="0 -960 960 960">
    <path d="M479.8-359.539q-6.431 0-11.961-2.308-5.531-2.308-10.146-6.923L272.262-554.201q-8.646-8.645-8.338-18.722.307-10.077 9-18.769 8.692-8.692 18.576-8.692t18.576 8.692L480-420.768l170.924-170.924q8.307-8.307 18.384-8 10.076.308 18.768 9 8.693 8.692 8.693 18.577 0 9.884-9.031 18.858L502.307-368.77q-5.015 4.615-10.546 6.923-5.53 2.308-11.961 2.308Z" />
  </Svg>;
}

export function IconChevronDownInline() {
  return <IconChevronDown className="icon-chevron-down-inline" />;
}

export function IconHeadshot(props: HtmlProps) {
  return <img {...props} src={csgo_headshot}
    className={`icon-headshot ${props.className ?? ""}`} />;
}