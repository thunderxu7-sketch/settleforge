import { chromeStorage } from './storage';

export const NOTIFY_EVENT_KEY = 'notify_event';

export async function sendNotifyEvent(action: string, data: any, origin?: string) {
  await chromeStorage.setItem(NOTIFY_EVENT_KEY, {
    action,
    data,
    ts: Date.now(),
    origin,
  });
}
