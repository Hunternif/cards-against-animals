interface Props
  extends React.InputHTMLAttributes<HTMLInputElement> {
}

export function Checkbox(props: Props) {
  return <div className="checkbox">
    <input type="checkbox" name="check" {...props} />
    <label></label>
  </div>;
}