import { ReactNode } from "react";
import { GameButton } from "./Buttons";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

interface Props {
  show: boolean,
  // title: string,
  children: ReactNode,
  okText?: string,
  title?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
  loading?: boolean,
  loadingText?: string,
  className?: string,
  hideCancel?: boolean,
}

export function ConfirmModal({
  show, children, okText, title, cancelText, loadingText, loading,
  className, hideCancel, onConfirm, onCancel,
}: Props) {
  return <Modal show={show} className={className}>
    {title && <div className="modal-title">{title}</div>}
    <div className="modal-body">
      {loading ? <LoadingSpinner text={loadingText} /> : children}
    </div>
    <footer>
      <GameButton onClick={onConfirm} disabled={loading}>
        {okText ?? "Yes"}
      </GameButton>
      {!hideCancel && <GameButton onClick={onCancel} disabled={loading}>
        {cancelText ?? "Cancel"}
      </GameButton>}
    </footer>
  </Modal>;
}