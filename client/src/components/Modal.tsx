import { ReactNode } from "react";
import { copyFields } from "../shared/utils";
import { ModalBackdrop } from "./ModalBackdrop";
import { useKeyDown } from "./utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean,
  title?: string,
  noFade?: boolean,
  onHide?: () => void,
}

/** Modal card centered over the screen. */
export function Modal(props: ModalProps) {
  if (!props.show) return null;
  return <ShownModal {...props} />;
}

function ShownModal(props: ModalProps) {
  useKeyDown(() => props.show && props.onHide && props.onHide(), ["Escape"]);
  const newProps = copyFields(props, ["title", "show", "noFade", "onHide", "children"]);
  return <>
    {!props.noFade && <ModalBackdrop style={{ zIndex: "19" }} />}
    <div className="modal-container" onClick={props.onHide}>
      <div {...newProps} className={`modal-card ${props.className ?? ""}`}
        // Prevent clicking on the card from closing the modal:
        onClick={(e) => e.stopPropagation()}
      >
        {props.title && <div className="modal-title">{props.title}</div>}
        {props.children}
      </div>
    </div>
  </>;
}

interface BodyProps {
  children: ReactNode,
  loading?: boolean,
  loadingText?: string,
}

export function ModalBody({
  children, loadingText, loading,
}: BodyProps) {
  return <div className="modal-body">
    {loading ? <LoadingSpinner text={loadingText} /> : children}
  </div>;
}