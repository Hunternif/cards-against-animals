import {
  Transaction,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import {
  responseCardInGameConverter,
  turnConverter,
} from '../../shared/firestore-converters';
import { GameTurn, ResponseCardInGame } from '../../shared/types';
import { lobbiesRef } from '../lobby/lobby-repository';

///////////////////////////////////////////////////////////////////////////////
//
//  A game Lobby consists of many Turns.
//  This module containts methods to read and write Turn data in Firestore.
//  For now it's too inconvenient to make it a "real" Repository class...
//
///////////////////////////////////////////////////////////////////////////////

/** Returns Firestore subcollection reference of turns in lobby. */
export function getTurnsRef(lobbyID: string) {
  return collection(lobbiesRef, lobbyID, 'turns').withConverter(turnConverter);
}

export function getTurnRef(lobbyID: string, turnID: string) {
  return doc(getTurnsRef(lobbyID), turnID);
}

/** Returns Firestore subcollection reference of player responses in turn. */
export function getPlayerHandRef(
  lobbyID: string,
  turnID: string,
  userID: string,
) {
  const turnRef = getTurnRef(lobbyID, turnID);
  return collection(turnRef, 'player_data', userID, 'hand').withConverter(
    responseCardInGameConverter,
  );
}

/** Fetches all turns that occurred in the lobby. */
export async function getAllTurns(lobbyID: string): Promise<Array<GameTurn>> {
  return (await getDocs(getTurnsRef(lobbyID))).docs.map((d) => d.data());
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
export async function updateTurn(
  lobbyID: string,
  turn: GameTurn,
  transaction?: Transaction,
): Promise<void> {
  const ref = getTurnRef(lobbyID, turn.id);
  const data = turnConverter.toFirestore(turn);
  if (transaction) {
    transaction.update(ref, data);
  } else {
    await updateDoc(ref, data);
  }
}

/** Updates Firestore document with this turn data.
 * Doesn't update subcollections! */
export async function updateHandCard(
  lobbyID: string,
  turnID: string,
  userID: string,
  card: ResponseCardInGame,
) {
  await updateDoc(
    doc(getPlayerHandRef(lobbyID, turnID, userID), card.id),
    responseCardInGameConverter.toFirestore(card),
  );
}
