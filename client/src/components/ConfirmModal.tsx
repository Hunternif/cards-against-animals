import { ReactNode } from "react";
import { GameButton } from "./Buttons";
import { Modal, ModalBody } from "./Modal";

interface ModalProps {
  show: boolean,
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
}: ModalProps) {
  return <Modal
    show={show}
    title={title}
    className={className}
    onHide={onCancel}
  >
    <ModalBody loading={loading} loadingText={loadingText}>
      {children}
    </ModalBody>
    <ConfirmModalFooter
      okText={okText}
      cancelText={cancelText}
      disabled={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      hideCancel={hideCancel}
    />
  </Modal>;
}

interface FooterProps {
  children?: ReactNode,
  okText?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
  disabled?: boolean,
  hideCancel?: boolean,
}

export function ConfirmModalFooter({
  children, okText, cancelText, disabled, hideCancel, onConfirm, onCancel,
}: FooterProps) {
  return <footer className="modal-footer">
    {children ?? <>
      <GameButton onClick={onConfirm} disabled={disabled}>
        {okText ?? "Yes"}
      </GameButton>
      {!hideCancel && <GameButton onClick={onCancel} disabled={disabled}>
        {cancelText ?? "Cancel"}
      </GameButton>}
    </>}
  </footer>
}