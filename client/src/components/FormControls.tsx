import { CSSProperties, ChangeEvent, useContext } from "react";
import { ErrorContext } from "./ErrorContext";

const controlStyle: CSSProperties = {
  maxWidth: "12em",
}

interface NumberInputProps {
  min: number,
  max: number,
  value: number,
  disabled?: boolean,
  onChange: (newValue: number) => Promise<void>,
}

export function NumberInput(
  { min, max, value, disabled, onChange }: NumberInputProps
) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(event.target.value);
    await onChange(newValue).catch((e) => setError(e));
  }

  return (
    <input className="control" style={controlStyle} disabled={disabled}
      type="number" min={min} max={max}
      value={value} onChange={handleChange} />
  );
}