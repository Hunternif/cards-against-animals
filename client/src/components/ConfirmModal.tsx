import { ReactNode } from 'react';
import { ButtonProps, GameButton } from './Buttons';
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
  /** Shows loading state on the 'ok' button */
  processing?: boolean;
  loadingText?: string;
  className?: string;
  hideCancel?: boolean;
  /** See ModalBody props */
  longFormat?: boolean;
  /** See ModalBody props */
  scroll?: boolean;
  closeButton?: boolean;
  okButton?: ButtonProps;
}

export function ConfirmModal({
  show,
  children,
  okText,
  title,
  cancelText,
  loadingText,
  loading,
  processing,
  className,
  hideCancel,
  onConfirm,
  onCancel,
  longFormat,
  scroll,
  closeButton,
  okButton,
}: ModalProps) {
  return (
    <Modal
      show={show}
      title={title}
      className={className}
      onHide={onCancel}
      closeButton={closeButton}
    >
      <form className="modal-confirm-form" onSubmit={(e) => e.preventDefault()}>
        <ModalBody
          loading={loading}
          loadingText={loadingText}
          longFormat={longFormat}
          scroll={scroll}
        >
          {children}
        </ModalBody>
        <ConfirmModalFooter
          okText={okText}
          okButton={okButton}
          cancelText={cancelText}
          disabled={loading}
          onCancel={onCancel}
          onConfirm={onConfirm}
          hideCancel={hideCancel}
          processing={processing}
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
  /** Shows loading state on the 'ok' button */
  processing?: boolean;
  okButton?: ButtonProps;
}

export function ConfirmModalFooter({
  children,
  okText,
  cancelText,
  disabled,
  hideCancel,
  onConfirm,
  onCancel,
  processing,
  okButton,
}: FooterProps) {
  return (
    <ModalFooter>
      {children ?? (
        <>
          <GameButton
            submit
            onClick={onConfirm}
            disabled={disabled}
            loading={processing}
            {...okButton}
          >
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
