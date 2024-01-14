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

/** Form input: integer numbers */
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


interface SelectInputProps<T extends string> {
  value: T,
  options: SelectOption<T>[],
  disabled?: boolean,
  onChange: (newValue: T) => Promise<void>,
}
type SelectOption<T> = [value: T, label: string];

/** Form input: dropdown list of enum type T. */
export function SelectInput<T extends string>(
  { value, disabled, options, onChange }: SelectInputProps<T>
) {
  const { setError } = useContext(ErrorContext);

  async function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const newValue = event.target.value as T;
    await onChange(newValue).catch((e) => setError(e));
  }

  return (
    <select style={controlStyle} disabled={disabled}
      value={value} onChange={handleSelect}>
      {options.map((op) => <option value={op[0]}>{op[1]}</option>)}
    </select>
  );
}