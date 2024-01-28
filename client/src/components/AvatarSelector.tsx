import { useEffect, useState } from "react";
import { updateUserData, useCAAUser } from "../model/users-api";
import { CAAUser } from "../shared/types";
import { avatarMap, avatars } from "../model/avatars";
import { ConfirmModal } from "./ConfirmModal";
import { LoadingSpinner } from "./LoadingSpinner";

interface AvaProps {
  caaUser?: CAAUser,
  /** Will not set a random avatar while it's loading */
  loading?: boolean,
  initAvatarID: string,
}

export function AvatarSelector({ caaUser, loading, initAvatarID }: AvaProps) {
  const [userLoaded, setUserLoaded] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [avatarID, setAvatarID] = useState(initAvatarID);
  const [nextAvatarID, setNextAvatarID] = useState(initAvatarID);
  const avatar = avatarMap.get(avatarID) ?? avatars[0];

  function openSelector() {
    setNextAvatarID(avatarID);
    setShowSelector(true);
  }

  function closeSelector() {
    setShowSelector(false);
  }

  async function applyAvatar() {
    closeSelector();
    setAvatarID(nextAvatarID);
    if (caaUser) {
      await updateUserData(caaUser.uid, caaUser.name, nextAvatarID);
    }
  }

  // When the user loads first, set the initial avatar:
  useEffect(() => {
    if (caaUser) {
      if (caaUser.avatar_id) {
        setAvatarID(caaUser.avatar_id);
      } else {
        // Save the current random avatar:
        applyAvatar();
      }
    }
  }, [caaUser?.uid]);

  // Prevent flashing the first image
  useEffect(() => {
    setUserLoaded(!loading);
  }, [loading]);

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
      {(loading || !userLoaded) ? <LoadingSpinner delay /> : (
        <img src={avatar.url} className="avatar avatar-selector"
          onClick={openSelector} />
      )}
    </div>
  </>;
}

interface AnonAvatarProps {
  userID?: string,
  /** Will not set a random avatar while it's loading */
  loading?: boolean,
  initAvatarID: string,
}

export function AnonymousAvatarSelector(
  { userID, loading, initAvatarID }: AnonAvatarProps,
) {
  if (userID) return <UserAvatarSelector userID={userID} initAvatarID={initAvatarID} />;
  else return <AvatarSelector loading={loading} initAvatarID={initAvatarID} />;
}

interface UserAvatarProps {
  userID: string,
  initAvatarID: string,
}

function UserAvatarSelector({ userID, initAvatarID }: UserAvatarProps) {
  const [caaUser, loading] = useCAAUser(userID);
  return <AvatarSelector caaUser={caaUser} loading={loading}
    initAvatarID={initAvatarID} />;
}