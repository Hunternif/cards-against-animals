/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";

// Thanks to https://stackoverflow.com/a/42756623/1093712
const withCors = cors();

import firebaseConfig from "../../firebase-config.json";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest(
  { region: firebaseConfig.region },
  (request, response) => {
    withCors(request, response, () => {
      logger.info("Hello logs!", { structuredData: true });
      response.status(200).send({ data: { msg: "Hello from Firebase!" } });
    });
  });
