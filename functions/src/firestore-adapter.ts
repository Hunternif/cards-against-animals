// This module abstracts types and functions needed by firestore-converters,
// which differ between the client-side and the server-side Firestore modules.

// Server-side version

import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp
} from "firebase-admin/firestore";

export type FConverter<T> = FirestoreDataConverter<T>;
export type FDocSnapshot = QueryDocumentSnapshot;
export const FTimestamp = Timestamp;
export type FTimestamp = Timestamp;
export function fServerTimestamp() {
  return Timestamp.now();
}