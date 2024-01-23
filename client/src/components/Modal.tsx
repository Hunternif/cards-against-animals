import { CSSProperties } from "react";
import { copyFields } from "../shared/utils";
import { ModalBackdrop } from "./ModalBackdrop";
import { CenteredLayout } from "./layout/CenteredLayout";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean,
  noFade?: boolean,
}

const containerStyle: CSSProperties = {
  position: "fixed",
  zIndex: 20,
  width: "100vw",
  height: "100vh",
  top: 0,
  left: 0,
}

/** Modal card centered over the screen. */
export function Modal(props: ModalProps) {
  if (!props.show) return null;
  const newProps = copyFields(props, ["show"]);
  return <>
    {!props.noFade && <ModalBackdrop style={{ zIndex: "19" }} />}
    <CenteredLayout outerStyle={containerStyle}>
      <div {...newProps} className={`modal-card ${props.className ?? ""}`} />
    </CenteredLayout>
  </>;
}