import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import a from '../assets/sounds/a.mp3';
import bruh from '../assets/sounds/bruh.mp3';
import clown_honk from '../assets/sounds/clown_honk.mp3';
import cum from '../assets/sounds/cum.mp3';
import mc_uh from '../assets/sounds/mc_uh.mp3';
import wow from '../assets/sounds/wow.mp3';
import yikes from '../assets/sounds/yikes.mp3';
import { soundEventConverter } from '../shared/firestore-converters';
import { GameLobby, PlayerInLobby, SoundEvent } from '../shared/types';
import { getLobbyRef } from './lobby/lobby-repository';

export function getSoundsRef(lobbyID: string) {
  const lobbyRef = getLobbyRef(lobbyID);
  return collection(lobbyRef, 'sounds').withConverter(soundEventConverter);
}

/** Get all likes on this response. */
export async function getSounds(lobby: GameLobby): Promise<SoundEvent[]> {
  return (await getDocs(getSoundsRef(lobby.id))).docs.map((d) => d.data());
}

/** Sends a soundboard sound to everyone in the turn. */
export async function postSoundEvent(
  lobby: GameLobby,
  player: PlayerInLobby,
  soundID: string,
) {
  const sound = new SoundEvent(player.uid, player.name, soundID);
  await setDoc(doc(getSoundsRef(lobby.id), player.uid), sound);
}

export const soundA = 'a';
export const soundBruh = 'bruh';
export const soundClownHonk = 'clown_honk';
export const soundCum = 'cum';
export const soundMcUh = 'mc_uh';
export const soundWow = 'wow';
export const soundYikes = 'yikes';

/** All known sounds */
const sounds = new Map<string, string>([
  [soundA, a],
  [soundBruh, bruh],
  [soundClownHonk, clown_honk],
  [soundCum, cum],
  [soundMcUh, mc_uh],
  [soundWow, wow],
  [soundYikes, yikes],
]);

export function playSoundEvent(
  event: SoundEvent,
  volume: number = 0.1,
): HTMLAudioElement | null {
  const url = sounds.get(event.sound_id) ?? null;
  if (url) {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play();
    return audio;
  }
  return null;
}
