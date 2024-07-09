import { User } from 'firebase/auth';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { GameLobby, PlayerInLobby } from '../../../shared/types';
import { EmptyPlayerCard, PlayerCard } from './PlayerCard';

interface ListProps {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
  /** If > 0, this number of slots will always be shown. */
  minSlots?: number;
  /** If > 0, only this number of slots will be displayed.
   * Otherwise, empty slots will be added indefinitely */
  maxSlots?: number;
  /** If true, empty slots will be added until the end of the screen. */
  fillSpace?: boolean;
  /** Number of extra slots to show if players < maxSlots. */
  extraEmptySlots?: number;
}

/** List of players in the lobby */
export function LobbyPlayerList({
  lobby,
  user,
  players,
  minSlots,
  maxSlots,
  fillSpace,
  extraEmptySlots,
}: ListProps) {
  // How many slots are needed to fill the screen
  const [fillCount, setFillCount] = useState(1);
  const [slots, setSlots] = useState<Array<ReactNode>>([]);
  const ulRef = useRef<HTMLUListElement>(null);

  // Update number of slots, so there is always more than players:
  useEffect(() => {
    let minCount = Math.max(
      1,
      players.length,
      Math.min(minSlots ?? 0, maxSlots ?? 0),
    );
    let maxCount = Math.min(
      maxSlots ?? 1,
      players.length + (extraEmptySlots ?? 0),
    );
    let slotCount = maxCount;
    if (fillSpace) {
      slotCount = fillCount;
    }
    if (slotCount < minCount) slotCount = minCount;
    // if (slotCount < players.length) slotCount = players.length;
    const newSlots = new Array<ReactNode>();
    for (let i = 0; i < slotCount; i++) {
      if (players[i]) {
        newSlots.push(
          <PlayerCard
            lobby={lobby}
            player={players[i]}
            isMe={user.uid === players[i].uid}
            isCreator={lobby.creator_uid === players[i].uid}
            canKick={lobby.creator_uid === user.uid}
          />,
        );
      } else {
        newSlots.push(<EmptyPlayerCard />);
      }
    }
    setSlots(newSlots);
  }, [players, fillCount, maxSlots, lobby, user.uid]);

  // Set initial number of slots to fill the entire screen:
  useEffect(() => {
    if (ulRef.current?.parentElement) {
      const containerHeight = ulRef.current.parentElement.clientHeight;
      const emSize = Math.max(
        12,
        parseFloat(getComputedStyle(ulRef.current).fontSize),
      );
      const slotHeight = 3.5 * emSize;
      setFillCount(Math.floor(containerHeight / slotHeight) - 1);
    }
  }, [ulRef]);

  return (
    <ul style={{ padding: 0, margin: 0 }} ref={ulRef}>
      {slots.map((slot, i) => (
        <li key={i} style={{ listStyleType: 'none' }}>
          {slot}
        </li>
      ))}
    </ul>
  );
}
