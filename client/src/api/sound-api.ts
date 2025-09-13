// Applause
import applause_high from '../assets/sounds/applause/applause_high.mp3';
import applause_low from '../assets/sounds/applause/applause_low.mp3';
import cheer from '../assets/sounds/applause/cheer.mp3';
import golf_clap from '../assets/sounds/applause/golf_clap.mp3';
import kids_cheer from '../assets/sounds/applause/kids_cheer.mp3';

// Laugh
// Sound effects from https://www.zapsplat.com
import laugh_001 from '../assets/sounds/laugh/laugh_001.mp3';
import laugh_002 from '../assets/sounds/laugh/laugh_002.mp3';
import laugh_003 from '../assets/sounds/laugh/laugh_003.mp3';
import laugh_004 from '../assets/sounds/laugh/laugh_004.mp3';
import laugh_005 from '../assets/sounds/laugh/laugh_005.mp3';
import laugh_006 from '../assets/sounds/laugh/laugh_006.mp3';
import laugh_007 from '../assets/sounds/laugh/laugh_007.mp3';
import laugh_008 from '../assets/sounds/laugh/laugh_008.mp3';
import laugh_009 from '../assets/sounds/laugh/laugh_009.mp3';
import laugh_010 from '../assets/sounds/laugh/laugh_010.mp3';
import laugh_011 from '../assets/sounds/laugh/laugh_011.mp3';
import laugh_012_long from '../assets/sounds/laugh/laugh_012_long.mp3';
import laugh_013 from '../assets/sounds/laugh/laugh_013.mp3';
import laugh_014 from '../assets/sounds/laugh/laugh_014.mp3';
import laugh_015 from '../assets/sounds/laugh/laugh_015.mp3';
import laugh_016 from '../assets/sounds/laugh/laugh_016.mp3';
import laugh_017 from '../assets/sounds/laugh/laugh_017.mp3';
import laugh_018 from '../assets/sounds/laugh/laugh_018.mp3';

// Soundboard
import a from '../assets/sounds/a.mp3';
import bruh from '../assets/sounds/bruh.mp3';
import clown_honk from '../assets/sounds/clown_honk.mp3';
import cum from '../assets/sounds/cum.mp3';
import mc_uh from '../assets/sounds/mc_uh.mp3';
import wow from '../assets/sounds/wow.mp3';
import yikes from '../assets/sounds/yikes.mp3';

// Music
import nge_ed from '../assets/sounds/music/nge_ed.mp3';
import robert_b_weide from '../assets/sounds/music/robert_b_weide.mp3';
import roundabout from '../assets/sounds/music/roundabout.mp3';
import bakemonogatari from '../assets/sounds/music/bakemonogatari.mp3';
import dokidoki1 from '../assets/sounds/music/dokidoki1.mp3';
import dokidoki2 from '../assets/sounds/music/dokidoki2.mp3';
import sans from '../assets/sounds/music/sans.mp3';

import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { soundEventConverter } from '../shared/firestore-converters';
import { GameLobby, PlayerInLobby, SoundEvent } from '../shared/types';
import { getLobbyRef } from './lobby/lobby-repository';
import { RNG } from '../shared/rng';

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

// Soundboard
export const soundA = 'a';
export const soundBruh = 'bruh';
export const soundClownHonk = 'clown_honk';
export const soundCum = 'cum';
export const soundMcUh = 'mc_uh';
export const soundWow = 'wow';
export const soundYikes = 'yikes';

// Music
export const soundMusicNge = 'nge_ed';
export const soundMusicWeide = 'robert_b_weide';
export const soundMusicRoundabout = 'roundabout';
export const soundMusicBakemonogatari = 'bakemonogatari';
export const soundMusicDokidoki1 = 'dokidoki1';
export const soundMusicDokidoki2 = 'dokidoki2';
export const soundMusicSans = 'sans';

// Applause
export const soundApplauseLow = 'applause_low';
export const soundApplauseHigh = 'applause_high';
export const soundCheer = 'cheer';
export const soundGolfClap = 'golf_clap';
export const soundKidsCheer = 'kids_cheer';

// Laugh
// Sound effects from https://www.zapsplat.com
export const soundLaugh001 = 'laugh_001';
export const soundLaugh002Mid = 'laugh_002';
export const soundLaugh003Mid = 'laugh_003';
export const soundLaugh004 = 'laugh_004';
export const soundLaugh005 = 'laugh_005';
export const soundLaugh006 = 'laugh_006';
export const soundLaugh007 = 'laugh_007';
export const soundLaugh008 = 'laugh_008';
export const soundLaugh009 = 'laugh_009';
export const soundLaugh010 = 'laugh_010';
export const soundLaugh011 = 'laugh_011';
export const soundLaugh012Long = 'laugh_012_long';
export const soundLaugh013 = 'laugh_013';
export const soundLaugh014Mid = 'laugh_014';
export const soundLaugh015Mid = 'laugh_015';
export const soundLaugh016Mid = 'laugh_016';
export const soundLaugh017 = 'laugh_017';
export const soundLaugh018 = 'laugh_018';

/** All known sounds */
const sounds = new Map<string, string>([
  // Soundboard
  [soundA, a],
  [soundBruh, bruh],
  [soundClownHonk, clown_honk],
  [soundCum, cum],
  [soundMcUh, mc_uh],
  [soundWow, wow],
  [soundYikes, yikes],

  // Music
  [soundMusicNge, nge_ed],
  [soundMusicWeide, robert_b_weide],
  [soundMusicRoundabout, roundabout],
  [soundMusicBakemonogatari, bakemonogatari],
  [soundMusicDokidoki1, dokidoki1],
  [soundMusicDokidoki2, dokidoki2],
  [soundMusicSans, sans],

  // Applause
  [soundApplauseLow, applause_low],
  [soundApplauseHigh, applause_high],
  [soundCheer, cheer],
  [soundGolfClap, golf_clap],
  [soundKidsCheer, kids_cheer],

  // Laugh
  // Sound effects from https://www.zapsplat.com
  [soundLaugh001, laugh_001],
  [soundLaugh002Mid, laugh_002],
  [soundLaugh003Mid, laugh_003],
  [soundLaugh004, laugh_004],
  [soundLaugh005, laugh_005],
  [soundLaugh006, laugh_006],
  [soundLaugh007, laugh_007],
  [soundLaugh008, laugh_008],
  [soundLaugh009, laugh_009],
  [soundLaugh010, laugh_010],
  [soundLaugh011, laugh_011],
  [soundLaugh012Long, laugh_012_long],
  [soundLaugh013, laugh_013],
  [soundLaugh014Mid, laugh_014],
  [soundLaugh015Mid, laugh_015],
  [soundLaugh016Mid, laugh_016],
  [soundLaugh017, laugh_017],
  [soundLaugh018, laugh_018],
]);

export async function playSoundEvent(
  event: SoundEvent,
  volume: number = 0.1,
): Promise<HTMLAudioElement | null> {
  return await playSoundID(event.sound_id, volume);
}

/** If the sound ID is valid, starts playing and returns its Audio object. */
export async function playSoundID(
  soundID: string,
  volume: number = 0.1,
): Promise<HTMLAudioElement | null> {
  const url = sounds.get(soundID) ?? null;
  if (url) {
    const audio = new Audio(url);
    audio.volume = volume;
    await audio.play();
    return audio;
  }
  return null;
}

const shortLaughs = [
  soundLaugh001,
  // soundLaugh002Mid,
  // soundLaugh003Mid,
  soundLaugh004,
  soundLaugh005,
  soundLaugh006,
  soundLaugh007,
  soundLaugh008,
  soundLaugh009,
  soundLaugh010,
  soundLaugh011,
  // soundLaugh012Mid,
  soundLaugh013,
  // soundLaugh014Mid,
  // soundLaugh015Mid,
  // soundLaugh016Mid,
  soundLaugh017,
  soundLaugh018,
];

const bgm = [
  soundMusicBakemonogatari,
  soundMusicDokidoki1,
  soundMusicDokidoki2,
  soundMusicSans,
]

/** Returns random sound ID */
export function randomLaugh(): string {
  const i = RNG.fromTimestamp().randomIntClamped(0, shortLaughs.length - 1);
  return shortLaughs[i];
}

/** Returns random sound ID */
export function randomBgm(seed: number = Date.now()): string {
  const i = RNG.fromIntSeed(seed).randomIntClamped(0, bgm.length - 1);
  return bgm[i];
}