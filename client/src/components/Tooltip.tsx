import { ReactNode } from 'react';
import { Delay } from './Delay';

interface Props {
  children: ReactNode;
  tooltip: ReactNode;
}

export function Tooltip({ children, tooltip }: Props) {
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-panel">{tooltip}</div>
    </div>
  );
}
