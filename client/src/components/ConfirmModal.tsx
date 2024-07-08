import { ReactNode } from 'react';
import { GameButton } from './Buttons';
import { Modal, ModalBody, ModalFooter } from './Modal';

interface ModalProps {
  show: boolean;
  children: ReactNode;
  okText?: string;
  title?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  hideCancel?: boolean;
}

export function ConfirmModal({
  show,
  children,
  okText,
  title,
  cancelText,
  loadingText,
  loading,
  className,
  hideCancel,
  onConfirm,
  onCancel,
}: ModalProps) {
  return (
    <Modal show={show} title={title} className={className} onHide={onCancel}>
      <form className="modal-confirm-form" onSubmit={(e) => e.preventDefault()}>
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
      </form>
    </Modal>
  );
}

interface FooterProps {
  children?: ReactNode;
  okText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  hideCancel?: boolean;
}

export function ConfirmModalFooter({
  children,
  okText,
  cancelText,
  disabled,
  hideCancel,
  onConfirm,
  onCancel,
}: FooterProps) {
  return (
    <ModalFooter>
      {children ?? (
        <>
          <GameButton submit onClick={onConfirm} disabled={disabled}>
            {okText ?? 'Yes'}
          </GameButton>
          {!hideCancel && (
            <GameButton onClick={onCancel} disabled={disabled}>
              {cancelText ?? 'Cancel'}
            </GameButton>
          )}
        </>
      )}
    </ModalFooter>
  );
}
