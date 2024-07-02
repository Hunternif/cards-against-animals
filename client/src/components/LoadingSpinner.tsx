import { CSSProperties } from 'react';
import { Spinner } from 'react-bootstrap';
import { CenteredLayout } from './layout/CenteredLayout';
import { Delay } from './Delay';

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
    <Spinner
      className="inline-spinner"
      style={{ width: '1em', height: '1em' }}
    />
  ) : (
    <CenteredLayout innerStyle={{ textAlign: 'center', ...style }}>
      {text && <h5 style={{ marginBottom: '1em' }}>{text}</h5>}
      <Spinner />
    </CenteredLayout>
  );
  if (delay || delayMs) return <Delay delayMs={delayMs}>{component}</Delay>;
  else return component;
}
