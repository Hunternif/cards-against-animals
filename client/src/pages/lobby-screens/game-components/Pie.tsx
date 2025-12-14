import { Svg } from '../../../components/Icons';

interface Props {
  /** From 0 to 100. */
  percent: number;
  /** If true, the pie timer will go from full to nothing. */
  reverse?: boolean;
  className?: string;
}

export function Pie({ percent, reverse, className }: Props) {
  const classes = ['pie'];
  if (className) classes.push(className);
  return (
    <div className={classes.join(' ')}>
      <Svg className="pie-svg" viewBox="0 0 200 200">
        <path
          fill="currentColor"
          d={svgPiePath(percent * 3.6, 100, reverse)}
          transform="translate(100, 100)"
        />
      </Svg>
    </div>
  );
}

/**
 * Returns a SVG path that covers the given angle.
 * Thanks to https://css-tricks.com/css-pie-timer/#comment-184984
 */
function svgPiePath(degrees: number, radius: number, reverse?: boolean) {
  // if (reverse) degrees = 360 - degrees;
  if (degrees < 0) degrees = 0;
  if (degrees >= 360) degrees = 359.999;
  const r = (degrees * Math.PI) / 180;
  const x = Math.sin(r) * radius;
  const y = Math.cos(r) * -radius;
  const mid = degrees > 180 ? 1 : 0;
  if (reverse) {
    return `M 0 0 v -${radius} A ${radius} ${radius} 1 ${
      1 - mid
    } 0 ${x} ${y} z`;
  }
  return `M 0 0 v -${radius} A ${radius} ${radius} 1 ${mid} 1 ${x} ${y} z`;
}
