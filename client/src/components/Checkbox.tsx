import { ChangeEvent, useId } from "react";

interface Props
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onToggle?: (checked: boolean) => void,
}

export function Checkbox(props: Props) {
  // generate unique ID
  const id = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!props.disabled) {
      const newChecked = event.target.checked;
      if (props.onToggle) props.onToggle(newChecked);
    }
  }

  return <div className={`checkbox ${props.className ?? ""}`} style={props.style}>
    <input type="checkbox" name="check" {...props} id={id}
      onChange={props.onChange ?? handleChange}
      // This prevents onClick propagating twice:
      // https://github.com/Semantic-Org/Semantic-UI-React/issues/3433
      onClick={(e) => e.stopPropagation()} />
    <label htmlFor={id} ></label>
  </div>;
}