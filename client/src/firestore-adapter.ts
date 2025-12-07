// This module abstracts types and functions needed by firestore-converters,
// which differ between the client-side and the server-side Firestore modules.

// Client-side version

import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

export type FConverter<T> = FirestoreDataConverter<T>;
export type FDocSnapshot = QueryDocumentSnapshot;
export const FTimestamp = Timestamp;
export type FTimestamp = Timestamp;
export function fServerTimestamp() {
  return serverTimestamp();
}