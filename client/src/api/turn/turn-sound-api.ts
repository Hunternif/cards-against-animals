import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { getTurnRef } from './turn-repository';
import { soundEventConverter } from '../../shared/firestore-converters';
import {
  GameLobby,
  GameTurn,
  PlayerInLobby,
  SoundEvent,
} from '../../shared/types';
import yikes from '../../assets/sounds/yikes.mp3';

export function getSoundsRef(lobbyID: string, turnID: string) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, 'sounds').withConverter(soundEventConverter);
}

/** Get all likes on this response. */
export async function getSounds(
  lobby: GameLobby,
  turn: GameTurn,
): Promise<SoundEvent[]> {
  return (await getDocs(getSoundsRef(lobby.id, turn.id))).docs.map((d) =>
    d.data(),
  );
}

/** Sends a soundboard sound to everyone in the turn. */
export async function postSound(
  lobby: GameLobby,
  turn: GameTurn,
  player: PlayerInLobby,
  soundID: string,
) {
  const sound = new SoundEvent(player.uid, player.name, soundID, new Date());
  const id = `${soundID}_${sound.time.getTime()}`;
  await setDoc(doc(getSoundsRef(lobby.id, turn.id), id), sound);
}

export const soundYikes = 'yikes';

/** All known sounds */
const sounds = new Map<string, string>([[soundYikes, yikes]]);

export function getSoundUrl(soundID: string): string | null {
  return sounds.get(soundID) ?? null;
}
