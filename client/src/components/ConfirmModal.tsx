import { GameButton } from "./Buttons";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

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

export function ConfirmModal({
  show, text, okText, cancelText, onConfirm, onCancel, loading, loadingText,
}: Props) {
  return <Modal show={show}>
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
  </Modal>;
}