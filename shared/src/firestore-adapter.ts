// This module abstracts types and functions needed by firestore-converters,
// which differ between the client-side and the server-side Firestore modules.

// This is a dummy implementation which will be ignored at runtime.
// Client and server projects must provide their own module 'firestore-adapter'.

export interface FConverter<T> {
  toFirestore(modelObject: T): any;
  fromFirestore(snapshot: FDocSnapshot): T;
}
export interface FDocSnapshot {
  get id(): string;
  data(): any;
};
export class FTimestamp {
  static fromDate(data: Date): FTimestamp {
    return new FTimestamp();
  }
  toDate(): Date {
    return new Date();
  }
}
export function fServerTimestamp() {
  return new FTimestamp();
}