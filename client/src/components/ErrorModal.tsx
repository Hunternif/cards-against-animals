import { Modal, ModalBody } from './Modal';

interface Props {
  error?: any;
  /** Used for clearing the error */
  setError: (error: any) => void;
}

export function ErrorModal({ error, setError }: Props) {
  return (
    <Modal
      closeButton
      show={error != undefined}
      onHide={() => setError(null)}
      className="error-modal"
      title="Error"
    >
      <ModalBody>{error instanceof Error && error.message}</ModalBody>
    </Modal>
  );
}
