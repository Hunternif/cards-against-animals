import { CSSProperties } from 'react';
import { Delay } from './Delay';
import { CenteredLayout } from './layout/CenteredLayout';

interface LoadingProps {
  text?: string;
  /** If true, will delay rendering by [delayMs] */
  delay?: boolean;
  delayMs?: number;
  style?: CSSProperties;
  inline?: boolean;
}

/** Displays a spinner at the center of the parent component. */
export function LoadingSpinner({
  text,
  delay,
  delayMs,
  style,
  inline,
}: LoadingProps) {
  const component = inline ? (
    <Spinner inline style={{ width: '1em', height: '1em' }} />
  ) : (
    <CenteredLayout innerStyle={{ textAlign: 'center', ...style }}>
      {text && <h5 style={{ marginBottom: '1em' }}>{text}</h5>}
      <Spinner />
    </CenteredLayout>
  );
  if (delay || delayMs) return <Delay delayMs={delayMs}>{component}</Delay>;
  else return component;
}

interface SpinnerProps {
  inline?: boolean;
  style?: CSSProperties;
}
function Spinner({ inline, style }: SpinnerProps) {
  const classes = ['spinner', 'spinner-border2'];
  if (inline) classes.push('inline-spinner');
  return <div className={classes.join(' ')} style={style} />;
}
