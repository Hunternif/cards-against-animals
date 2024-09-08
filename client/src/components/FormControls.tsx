import { ChangeEvent, ReactNode, useContext, useMemo, useState } from 'react';
import { debounce } from '../shared/utils';
import { Checkbox } from './Checkbox';
import { ErrorContext } from './ErrorContext';

export interface ControlProps {
  className?: string;
  accent?: boolean;
  secondary?: boolean;
  light?: boolean;
  lighter?: boolean;
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
  onChange: ChangeHandler<number>;
  debounce?: boolean;
}

type ChangeHandler<T> = (newValue: T) => Promise<void>;

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
  const [initialValue, setInitialValue] = useState(value);
  const [currentValue, setCurrentValue] = useState(value);
  const { setError } = useContext(ErrorContext);
  const debouncedHandler = useMemo(
    () => debounce(onChange) as ChangeHandler<number>,
    [onChange],
  );

  if (value != initialValue) {
    setInitialValue(value);
    setCurrentValue(value);
  }

  function validate(newValue: number): number {
    if (isNaN(newValue)) return min;
    if (newValue < min) return min;
    if (newValue > max) return max;
    return newValue;
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const strVal = event.target.value;
    const newValue = isInt ? parseInt(strVal) : parseFloat(strVal);
    setCurrentValue(newValue);
    if (isNaN(newValue)) return;
    try {
      const validValue = validate(newValue);
      if (props.debounce) {
        await debouncedHandler(validValue);
      } else {
        await onChange(validValue);
      }
    } catch (e: any) {
      setError(e);
    }
  }

  async function handleBlur(event: ChangeEvent<HTMLInputElement>) {
    // Validate:
    const strVal = event.target.value;
    let newValue = isInt ? parseInt(strVal) : parseFloat(strVal);
    const validValue = validate(newValue);
    setCurrentValue(validValue);
    try {
      await onChange(validValue);
    } catch (e: any) {
      setError(e);
    }
  }

  return (
    <input
      className={`control ${controlClass}`}
      disabled={disabled}
      type="number"
      min={min}
      max={max}
      step={step ?? 1}
      value={isNaN(currentValue) ? '' : currentValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

interface SelectInputProps<T extends string> extends ControlProps {
  value: T;
  options: SelectOption<T>[];
  disabled?: boolean;
  onChange: (newValue: T) => void | Promise<void>;
}
export type SelectOption<T> = [value: T, label: ReactNode];

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

interface TextInputProps extends ControlProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: ChangeHandler<string>;
  password?: boolean;
  debounce?: boolean;
  debounceMs?: number;
  iconLeft?: ReactNode;
}

/** Form input: text */
export function TextInput({
  value,
  placeholder,
  disabled,
  password,
  onChange,
  debounce: enableDebounce,
  debounceMs,
  iconLeft,
  ...props
}: TextInputProps) {
  const { setError } = useContext(ErrorContext);

  const controlClass = getControlStyle(props);
  const classes = ['control'];
  classes.push(controlClass);

  const debouncedHandler = useMemo(
    () => debounce(onChange, debounceMs ?? 1000) as ChangeHandler<string>,
    [onChange],
  );

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    try {
      const newValue = event.currentTarget.value;
      if (enableDebounce || (debounceMs != null && debounceMs > 0)) {
        await debouncedHandler(newValue);
      } else {
        await onChange(newValue);
      }
    } catch (e: any) {
      setError(e);
    }
  }
  return (
    <WithIcon iconLeft={iconLeft}>
      <input
        type={password ? 'password' : 'text'}
        className={classes.join(' ')}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
      />
    </WithIcon>
  );
}

interface WithIconProps {
  iconLeft?: ReactNode;
  children: ReactNode;
}
function WithIcon({ iconLeft, children }: WithIconProps) {
  if (iconLeft)
    return (
      <div className="with-icon-left">
        {children}
        <div className="input-icon-left">{iconLeft}</div>
      </div>
    );
  else return children;
}

export function getControlStyle({
  className,
  accent,
  light,
  lighter,
  secondary,
  small,
  tiny,
  inline,
}: ControlProps): string {
  const classes = new Array<string>();
  if (className) classes.push(className);
  if (accent) classes.push('accent-control');
  if (light) classes.push('light-control');
  if (lighter) classes.push('lighter-control');
  if (secondary) classes.push('secondary-control');
  if (small) classes.push('small-control');
  if (tiny) classes.push('tiny-control');
  if (inline) classes.push('inline-control');
  return classes.join(' ');
}

export function stripControlProps<T>({
  className,
  accent,
  light,
  lighter,
  secondary,
  small,
  inline,
  tiny,
  ...props
}: ControlProps & T) {
  return props;
}
