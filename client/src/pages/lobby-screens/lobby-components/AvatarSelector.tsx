import { useState } from "react";
import { ConfirmModalFooter } from "../../../components/ConfirmModal";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { Modal, ModalBody } from "../../../components/Modal";
import { avatarMap, playerAvatars } from "../../../api/avatars";

interface AvatarProps {
  /** Will not set a random avatar while it's loading */
  loading?: boolean,
  avatarID?: string | null,
  onSubmit: (avatarID: string) => void | Promise<void>,
  inline?: boolean,
}

/**
 * Renders a large avatar circle.
 * Clicking on it opens a view with all avatars.
 */
export function AvatarSelector({ loading, avatarID, onSubmit, inline }: AvatarProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [nextAvatarID, setNextAvatarID] = useState(avatarID ?? playerAvatars[0].id);
  const avatar = avatarID ? avatarMap.get(avatarID) : null;
  const inlineClass = inline ? "inline-avatar" : "";

  function openSelector() {
    if (avatarID) setNextAvatarID(avatarID);
    setShowSelector(true);
  }

  function closeSelector() {
    setShowSelector(false);
  }

  async function applyAvatar() {
    closeSelector();
    onSubmit(nextAvatarID);
  }

  return <>
    <Modal
      title="Choose avatar"
      className="avatar-selector-modal"
      show={showSelector}
      onHide={closeSelector}>
      <ModalBody>
        {playerAvatars.map((av) =>
          <img key={av.id} src={av.url}
            className={`avatar ${av.id === nextAvatarID ? "selected" : ""}`}
            onClick={() => setNextAvatarID(av.id)} />
        )}
      </ModalBody>
      <ConfirmModalFooter
        okText="Done"
        onCancel={closeSelector}
        onConfirm={() => applyAvatar()} />
    </Modal>

    <div className="avatar-selector">
      {(loading || !avatar) ? <LoadingSpinner delay /> : (
        <img src={avatar.url} className={`avatar avatar-selector ${inlineClass}`}
          onClick={openSelector} />
      )}
    </div>
  </>;
}