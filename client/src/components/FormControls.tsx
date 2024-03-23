import { ChangeEvent, useContext } from "react";
import { Checkbox } from "./Checkbox";
import { ErrorContext } from "./ErrorContext";


interface NumberInputProps {
  min: number,
  max: number,
  step?: number,
  value: number,
  disabled?: boolean,
  onChange: (newValue: number) => Promise<void>,
}

/** Form input: integer or float numbers */
export function NumberInput(
  { min, max, step, value, disabled, onChange }: NumberInputProps
) {
  const isInt = step != undefined && Math.floor(step) === step;
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const strVal = event.target.value;
    const newValue = isInt ? parseInt(strVal) : parseFloat(strVal);
    await onChange(newValue).catch((e) => setError(e));
  }

  return (
    <input className="control" disabled={disabled}
      type="number" min={min} max={max} step={step ?? 1}
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
    <select className="control" disabled={disabled}
      value={value} onChange={handleSelect}>
      {options.map((op) => <option key={op[0]} value={op[0]}>{op[1]}</option>)}
    </select>
  );
}


interface ToggleInputProps {
  value: boolean,
  disabled?: boolean,
  onChange: (newValue: boolean) => Promise<void>,
}

/** Form input: toggle */
export function ToggleInput(
  { value, disabled, onChange }: ToggleInputProps
) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(checked: boolean) {
    await onChange(checked).catch((e) => setError(e));
  }

  // TODO: make a fancier on/off toggle
  return (
    <Checkbox
      checked={value}
      disabled={disabled}
      onToggle={handleChange}
    />
  );
}