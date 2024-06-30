import * as logger from 'firebase-functions/logger';
import { database } from 'firebase-functions/v1';
import { DBPresence } from '../shared/types';

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
    } else  {
      logger.info(`User ${uid} is offline`);
      // TODO: update user status in their lobby, after a debounce time
    }
  });
