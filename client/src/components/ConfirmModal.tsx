import { Modal } from "react-bootstrap";
import { GameButton } from "./Buttons";

interface Props {
  show: boolean,
  // title: string,
  text: string,
  okText?: string,
  cancelText?: string,
  onConfirm: () => void,
  onCancel: () => void,
}

export function ConfirmModal({
  show, text, okText, cancelText, onConfirm, onCancel,
}: Props) {
  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
    >
      {/* <Modal.Header>
        <Modal.Title>{title}}</Modal.Title>
      </Modal.Header> */}
      <Modal.Body>{text}</Modal.Body>
      <Modal.Footer>
        <GameButton onClick={onConfirm}>{okText ?? "Yes"}</GameButton>
        <GameButton onClick={onCancel}>{cancelText ?? "Cancel"}</GameButton>
      </Modal.Footer>
    </Modal>
  );
}