import { CallableRequest, onCall } from 'firebase-functions/v2/https';

export type CallableHandler<I, O> = (event: CallableRequest<I>) => Promise<O>;

export function exportCallable<I, O>(
  handler: CallableHandler<I, O>,
  maxInstances: number = 2,
) {
  return onCall<I, Promise<O>>({ maxInstances }, handler);
}
