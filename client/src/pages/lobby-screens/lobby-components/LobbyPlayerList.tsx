import { User } from 'firebase/auth';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { GameLobby, PlayerInLobby } from '../../../shared/types';
import { EmptyPlayerCard, PlayerCard } from './PlayerCard';

interface ListProps {
  lobby: GameLobby;
  user: User;
  players: PlayerInLobby[];
  /** If > 0, only this number of slots will be displayed.
   * Otherwise, empty slots will be added indefinitely */
  maxSlots?: number;
  /** If true, empty slots will be added until the end of the screen. */
  fillSpace?: boolean;
}

/** List of players in the lobby */
export function LobbyPlayerList({
  lobby,
  user,
  players,
  maxSlots,
  fillSpace,
}: ListProps) {
  const [minSlotCount, setMinSlotCount] = useState(1);
  const [slotCount, setSlotCount] = useState(players.length);
  const [slots, setSlots] = useState<Array<ReactNode>>([]);
  const ulRef = useRef<HTMLUListElement>(null);

  // Update number of slots, so there is always more than players:
  useEffect(() => {
    let newSlotCount = players.length;
    if (maxSlots != null) {
      newSlotCount = maxSlots;
    } else {
      newSlotCount = Math.max(minSlotCount, slotCount, players.length + 2);
    }
    const newSlots = new Array<ReactNode>();
    for (let i = 0; i < newSlotCount; i++) {
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
    setSlotCount(newSlotCount);
  }, [players, players.length, minSlotCount, maxSlots, lobby, slotCount, user.uid]);

  // Set initial number of slots to fill the entire screen:
  useEffect(() => {
    if (maxSlots == null && fillSpace && ulRef.current?.parentElement) {
      const containerHeight = ulRef.current.parentElement.clientHeight;
      const emSize = Math.max(
        12,
        parseFloat(getComputedStyle(ulRef.current).fontSize),
      );
      const slotHeight = 3.5 * emSize;
      setMinSlotCount(Math.floor(containerHeight / slotHeight) - 1);
    }
  }, [ulRef, maxSlots, fillSpace]);

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
