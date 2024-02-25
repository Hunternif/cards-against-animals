import { copyFields } from "../../shared/utils";

interface Props extends React.HTMLAttributes<HTMLElement> {
  scrollLight?: boolean,
  scrollDark?: boolean,
}

export function ScrollContainer(props: Props) {
  const newProps = copyFields(props, ['scrollLight', 'scrollDark']);
  const lightStyle = props.scrollLight ? "miniscrollbar-light" : "";
  const darkStyle = props.scrollDark ? "miniscrollbar-dark" : "";
  return <div {...newProps}
    className={`layout-scroll-container miniscrollbar miniscrollbar-auto ${lightStyle} ${darkStyle} ${props.className ?? ""}`} />
}