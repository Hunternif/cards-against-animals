import { Modal } from "react-bootstrap";

interface Props {
  error?: any,
  /** Used for clearing the error */
  setError: (error: any) => void,
}

export function ErrorModal({ error, setError }: Props) {
  return (
    <Modal
      show={error != undefined}
      onHide={() => setError(null)}
      contentClassName="border-danger"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Error</Modal.Title>
      </Modal.Header>
      <Modal.Body>{error instanceof Error && error.message}</Modal.Body>
    </Modal>
  );
}