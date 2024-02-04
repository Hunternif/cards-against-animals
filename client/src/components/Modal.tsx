import { copyFields } from "../shared/utils";
import { ModalBackdrop } from "./ModalBackdrop";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean,
  noFade?: boolean,
}

/** Modal card centered over the screen. */
export function Modal(props: ModalProps) {
  if (!props.show) return null;
  const newProps = copyFields(props, ["show"]);
  return <>
    {!props.noFade && <ModalBackdrop style={{ zIndex: "19" }} />}
    <div className="modal-container">
      <div {...newProps} className={`modal-card ${props.className ?? ""}`} />
    </div>
  </>;
}