import { useState } from "react";
import { avatarMap, avatars, randomAvatarID } from "../api/avatars";
import { RNG } from "../shared/rng";
import { PlayerInLobby } from "../shared/types";

interface Props {
  player: PlayerInLobby,
}

export function PlayerAvatar({ player }: Props) {
  const [tempAvatarID] = useState(randomAvatarID(RNG.fromStrSeed(player.name)));
  const avatar = avatarMap.get(player.avatar_id ?? tempAvatarID) ?? avatars[0];
  return <img className="avatar inline-avatar" src={avatar.url} />;
}