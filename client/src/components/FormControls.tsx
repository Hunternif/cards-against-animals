import { ChangeEvent, ReactNode, useContext } from "react";
import { Checkbox } from "./Checkbox";
import { ErrorContext } from "./ErrorContext";

export interface ControlProps {
  className?: string;
  accent?: boolean;
  secondary?: boolean;
  light?: boolean;
  small?: boolean;
  tiny?: boolean;
  inline?: boolean;
}

interface NumberInputProps extends ControlProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  disabled?: boolean;
  onChange: (newValue: number) => Promise<void>;
}

/** Form input: integer or float numbers */
export function NumberInput({
  min,
  max,
  step,
  value,
  disabled,
  onChange,
  ...props
}: NumberInputProps) {
  const isInt = step != undefined && Math.floor(step) === step;
  const controlClass = getControlStyle(props);
  const { setError } = useContext(ErrorContext);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const strVal = event.target.value;
    const newValue = isInt ? parseInt(strVal) : parseFloat(strVal);
    await onChange(newValue).catch((e) => setError(e));
  }

  return (
    <input
      className={`control ${controlClass}`}
      disabled={disabled}
      type="number"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onChange={handleChange}
    />
  );
}

interface SelectInputProps<T extends string> extends ControlProps {
  value: T;
  options: SelectOption<T>[];
  disabled?: boolean;
  onChange: (newValue: T) => void | Promise<void>;
}
type SelectOption<T> = [value: T, label: ReactNode];

/** Form input: dropdown list of enum type T. */
export function SelectInput<T extends string>({
  value,
  disabled,
  options,
  onChange,
  ...props
}: SelectInputProps<T>) {
  const { setError } = useContext(ErrorContext);
  const controlClass = getControlStyle(props);

  async function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const newValue = event.target.value as T;
    try {
      await onChange(newValue);
    } catch (e: any) {
      setError(e);
    }
  }

  return (
    <select
      className={`control ${controlClass}`}
      disabled={disabled}
      value={value}
      onChange={handleSelect}
    >
      {options.map((op) => (
        <option key={op[0]} value={op[0]}>
          {op[1]}
        </option>
      ))}
    </select>
  );
}

interface ToggleInputProps {
  value: boolean;
  disabled?: boolean;
  onChange: (newValue: boolean) => Promise<void>;
}

/** Form input: toggle */
export function ToggleInput({ value, disabled, onChange }: ToggleInputProps) {
  const { setError } = useContext(ErrorContext);

  async function handleChange(checked: boolean) {
    await onChange(checked).catch((e) => setError(e));
  }

  // TODO: make a fancier on/off toggle
  return (
    <Checkbox checked={value} disabled={disabled} onToggle={handleChange} />
  );
}

export function getControlStyle({
  className,
  accent,
  light,
  secondary,
  small,
  tiny,
  inline,
}: ControlProps): string {
  const classes = new Array<string>();
  if (className) classes.push(className);
  if (accent) classes.push("accent-control");
  if (light) classes.push("light-control");
  if (secondary) classes.push("secondary-control");
  if (small) classes.push("small-control");
  if (tiny) classes.push("tiny-control");
  if (inline) classes.push("inline-contorl");
  return classes.join(" ");
}

export function stripControlProps<T>({
  className,
  accent,
  light,
  secondary,
  small,
  inline,
  tiny,
  ...props
}: ControlProps & T) {
  return props;
}
