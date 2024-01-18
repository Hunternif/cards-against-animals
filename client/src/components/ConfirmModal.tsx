import { CSSProperties } from "react";
import { GameButton } from "./Buttons";
import { ModalBackdrop } from "./ModalBackdrop";
import { CenteredLayout } from "./layout/CenteredLayout";

interface Props {
  show: boolean,
  // title: string,
  text: string,
  okText?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
}

const containerStyle: CSSProperties = {
  position: "fixed",
  zIndex: 20,
  width: "100vw",
  height: "100vh",
  top: 0,
  left: 0,
}

export function ConfirmModal({
  show, text, okText, cancelText, onConfirm, onCancel,
}: Props) {
  if (!show) return null;
  return <>
    <ModalBackdrop style={{ zIndex: "19" }} />
    <CenteredLayout outerStyle={containerStyle}>
      <div className="modal-card">
        <div className="modal-body">{text}</div>
        <footer>
          <GameButton onClick={onConfirm}>{okText ?? "Yes"}</GameButton>
          <GameButton onClick={onCancel}>{cancelText ?? "Cancel"}</GameButton>
        </footer>
      </div>
    </CenteredLayout>
  </>;
}