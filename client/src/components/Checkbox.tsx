import { ChangeEvent, ReactNode, useId, useRef } from 'react';

interface CheckProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onToggle?: (checked: boolean) => void;
  label?: string;
}

export function Checkbox({ label, onToggle, className, ...props }: CheckProps) {
  // generate unique ID
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!props.disabled) {
      const newChecked = event.target.checked;
      if (onToggle) onToggle(newChecked);
    }
  }

  function handleLabelClick() {
    if (ref.current && onToggle) {
      onToggle(!ref.current.checked);
    }
  }

  return (
    <LabelGroup label={label} onClick={handleLabelClick}>
      <div className={`checkbox ${className ?? ''}`} style={props.style}>
        <input
          type="checkbox"
          name="check"
          {...props}
          id={id}
          ref={ref}
          onChange={props.onChange ?? handleChange}
          // This prevents onClick propagating twice:
          // https://github.com/Semantic-Org/Semantic-UI-React/issues/3433
          onClick={(e) => e.stopPropagation()}
        />
        <label htmlFor={id}></label>
      </div>
    </LabelGroup>
  );
}

interface LabelProps {
  label?: string;
  onClick: () => void;
  children: ReactNode;
}

function LabelGroup({ label, onClick, children }: LabelProps) {
  if (label) {
    return (
      <div className="checkbox-label-group">
        {children}
        <label className="label" onClick={onClick}>{label}</label>
      </div>
    );
  } else {
    return children;
  }
}
