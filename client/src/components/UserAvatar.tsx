import { useState } from 'react';
import { avatarMap, playerAvatars, randomPlayerAvatarID } from '../api/avatars';
import { RNG } from '../shared/rng';
import { CAAUser } from '../shared/types';

interface Props {
  user: CAAUser;
}

export function UserAvatar({ user }: Props) {
  const [tempAvatarID] = useState(
    randomPlayerAvatarID(RNG.fromStrSeed(user.name)),
  );
  const avatar =
    avatarMap.get(user.avatar_id ?? tempAvatarID) ?? playerAvatars[0];
  return <img className="avatar inline-avatar" src={avatar.url} />;
}
