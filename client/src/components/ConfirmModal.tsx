import { ReactNode } from "react";
import { GameButton } from "./Buttons";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

interface Props {
  show: boolean,
  // title: string,
  children: ReactNode,
  okText?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
  loading?: boolean,
  loadingText?: string,
  className?: string,
}

export function ConfirmModal({
  show, children, okText, cancelText, onConfirm, onCancel, loading, loadingText,
  className,
}: Props) {
  return <Modal show={show} className={className}>
    <div className="modal-body">
      {loading ? <LoadingSpinner text={loadingText} /> : children}
    </div>
    <footer>
      <GameButton onClick={onConfirm} disabled={loading}>
        {okText ?? "Yes"}
      </GameButton>
      <GameButton onClick={onCancel} disabled={loading}>
        {cancelText ?? "Cancel"}
      </GameButton>
    </footer>
  </Modal>;
}