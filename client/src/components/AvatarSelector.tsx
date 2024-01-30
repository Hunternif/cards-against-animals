import { useState } from "react";
import { avatarMap, avatars } from "../model/avatars";
import { ConfirmModal } from "./ConfirmModal";
import { LoadingSpinner } from "./LoadingSpinner";

interface AvatarProps {
  /** Will not set a random avatar while it's loading */
  loading?: boolean,
  avatarID?: string,
  onSelect: (avatarID: string) => void,
}

/**
 * Renders a large avatar circle.
 * Clicking on it opens a view with all avatars.
 */
export function AvatarSelector({ loading, avatarID, onSelect }: AvatarProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [nextAvatarID, setNextAvatarID] = useState(avatarID ?? avatars[0].id);
  const avatar = avatarID ? avatarMap.get(avatarID) : null;

  function openSelector() {
    if (avatarID) setNextAvatarID(avatarID);
    setShowSelector(true);
  }

  function closeSelector() {
    setShowSelector(false);
  }

  async function applyAvatar() {
    closeSelector();
    onSelect(nextAvatarID);
  }

  return <>
    <ConfirmModal title="Choose avatar" okText="Done"
      className="avatar-selector-modal"
      show={showSelector}
      onCancel={closeSelector}
      onConfirm={() => applyAvatar()}>
      {avatars.map((av) =>
        <img key={av.id} src={av.url}
          className={`avatar ${av.id === nextAvatarID ? "selected" : ""}`}
          onClick={() => setNextAvatarID(av.id)} />
      )}
    </ConfirmModal>

    <div className="avatar-selector">
      {(loading || !avatar) ? <LoadingSpinner delay /> : (
        <img src={avatar.url} className="avatar avatar-selector"
          onClick={openSelector} />
      )}
    </div>
  </>;
}