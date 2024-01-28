import { useState } from "react";
import { useCAAUser } from "../model/users-api";
import { RNG } from "../shared/rng";
import { CAAUser } from "../shared/types";
import { avatarMap, avatars } from "./Avatars";

interface AvaProps {
  caaUser?: CAAUser,
}

export function AvatarSelector({ caaUser }: AvaProps) {
  const [avatarID] = useState(caaUser?.avatar_id ?? randomAvatarID());
  const avatar = avatarMap.get(avatarID) ?? avatars[0];
  return <img src={avatar.url} className="avatar avatar-selector" />;
}

function randomAvatarID(): string {
  const index = RNG.fromTimestamp().randomIntClamped(0, avatars.length);
  return Array.from(avatarMap.keys())[index];
}

interface AnonAvatarProps {
  userID?: string,
}

export function AnonymourAvatarSelector({ userID }: AnonAvatarProps) {
  if (userID) return <UserAvatarSelector userID={userID} />;
  else return <AvatarSelector />;
}

interface UserAvatarProps {
  userID: string,
}

function UserAvatarSelector({ userID }: UserAvatarProps) {
  const [caaUser] = useCAAUser(userID);
  return <AvatarSelector caaUser={caaUser} />;
}