import * as logger from 'firebase-functions/logger';
import { database } from 'firebase-functions/v1';
import { DBPresence } from '../shared/types';
import { setPlayerOffline } from '../api/lobby-server-api';

/** How long to wait before acting on the user's 'offline' status. */
const offlineDebounceMs = 3000;

/**
 * Monitors user presence from Realtime DB and updates it on Firestore.
 * See https://github.com/firebase/functions-samples/blob/703c035/Node-1st-gen/presence-firestore/functions/index.js
 */
export const createOnUserPresenceChangeHandler = () =>
  database.ref('/status/{uid}').onUpdate(async (change, context) => {
    const uid = context.params.uid;
    const eventStatus = change.after.val() as DBPresence;

    // It is likely that the Realtime Database change that triggered
    // this event has already been overwritten by a fast change in
    // online / offline status, so we'll re-read the current data
    // and compare the timestamps.
    const statusSnapshot = await change.after.ref.once('value');
    const status = statusSnapshot.val() as DBPresence;

    // If the current timestamp for this data is newer than
    // the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) {
      return;
    }

    if (eventStatus.state === 'online') {
      logger.info(`User ${uid} is online`);
    } else {
      // Debounce. This could cost money, but for a few seconds it's fine.
      setTimeout(async () => {
        // Verify if the user isn't online yet:
        const statusSnapshot = await change.after.ref.once('value');
        const status = statusSnapshot.val() as DBPresence;
        if (status.last_changed > eventStatus.last_changed) {
          // logger.info(
          //   `User ${uid} was briefly offline, but no longer than ${offlineDebounceMs}.`,
          // );
          return;
        }

        logger.info(`User ${uid} is offline`);
        await setPlayerOffline(uid);
      }, offlineDebounceMs);
    }
  });
