import { CSSProperties } from "react";
import { GameButton } from "./Buttons";
import { ModalBackdrop } from "./ModalBackdrop";
import { CenteredLayout } from "./layout/CenteredLayout";
import { LoadingSpinner } from "./LoadingSpinner";

interface Props {
  show: boolean,
  // title: string,
  text: string,
  okText?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
  loading?: boolean,
  loadingText?: string,
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
  show, text, okText, cancelText, onConfirm, onCancel, loading, loadingText,
}: Props) {
  if (!show) return null;
  return <>
    <ModalBackdrop style={{ zIndex: "19" }} />
    <CenteredLayout outerStyle={containerStyle}>
      <div className="modal-card">
        <div className="modal-body">
          {loading ? <LoadingSpinner text={loadingText} /> : text}
        </div>
        <footer>
          <GameButton onClick={onConfirm} disabled={loading}>
            {okText ?? "Yes"}
          </GameButton>
          <GameButton onClick={onCancel} disabled={loading}>
            {cancelText ?? "Cancel"}
          </GameButton>
        </footer>
      </div>
    </CenteredLayout>
  </>;
}