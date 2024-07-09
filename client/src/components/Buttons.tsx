import { ReactNode } from 'react';
import {
  ControlProps,
  getControlStyle,
  stripControlProps,
} from './FormControls';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ControlProps {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** If true, sets button type as 'submit' */
  submit?: boolean;
  /** If true, iconLeft becomes a spinner */
  loading?: boolean;
  /** If true, text will be centered, even if only 1 icon is present */
  centered?: boolean;
}

export function GameButton({
  iconLeft,
  iconRight,
  submit,
  loading,
  centered,
  ...props
}: ButtonProps) {
  const classes = ['game-button'];
  classes.push(getControlStyle(props));
  if (centered) classes.push('centered');
  const buttonProps = stripControlProps(props);
  const actualIconLeft =
    iconLeft ?? (loading ? <LoadingSpinner inline /> : null);
  const hasIcons = actualIconLeft != null || iconRight != null;
  if (actualIconLeft != null || iconRight != null) classes.push('has-icons');
  return (
    <button
      {...buttonProps}
      className={classes.join(' ')}
      type={submit ? 'submit' : 'button'}
      disabled={buttonProps.disabled ?? loading}
    >
      {hasIcons && <span className="icon-left">{actualIconLeft}</span>}
      <span style={{ flexGrow: 1 }}>{props.children}</span>
      {hasIcons && <span className="icon-right">{iconRight}</span>}
    </button>
  );
}

export function InlineButton(props: React.HTMLProps<HTMLSpanElement>) {
  return (
    <div className="inline-button-block">
      <span {...props} className={`inline-button ${props.className ?? ''}`} />
    </div>
  );
}
