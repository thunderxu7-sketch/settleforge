import EventEmitter from 'events';
import log from 'loglevel';
import { deprecateBroadcastMessage } from '../injected/utils';

export const ENVELOPE_EVENT = '__ENVELOPE_EVENT__';
export const ENVELOPE_REPLY_EVENT = '__ENVELOPE_REPLY_EVENT__';
export const NOTIFY_EVENT = '__NOTIFY_EVENT__';

export class EventTunnelAdjuster extends EventEmitter {
  private readonly tunnelKey: string;

  constructor(tunnelKey: string) {
    super();
    this.tunnelKey = tunnelKey;
    this.registerWindowEventListener();
  }

  registerWindowEventListener() {
    // receive from injected
    window.addEventListener(ENVELOPE_EVENT, ((event: CustomEvent) => {
      log.debug('get message from', event.detail.source, event);
      const { isTronLink = false, message, source } = event.detail;

      if (!isTronLink || (!message && !source)) {
        return;
      }

      if (source === this.tunnelKey) {
        return;
      }

      this.emit(ENVELOPE_EVENT, message);
    }) as EventListener);
  }

  reply(data: any) {
    const event = new CustomEvent(ENVELOPE_REPLY_EVENT, {
      detail: data,
    });
    window.dispatchEvent(event);

    deprecateBroadcastMessage('tabReply', data);
  }

  notify(data: any) {
    const event = new CustomEvent(NOTIFY_EVENT, {
      detail: data,
    });
    window.dispatchEvent(event);
  }
}

export class EventTunnelClient extends EventEmitter {
  private readonly tunnelKey: string;

  constructor(tunnelKey: string) {
    super();
    this.tunnelKey = tunnelKey;
    this.registerWindowEventListener();
  }

  registerWindowEventListener() {
    // receive from contentScript
    window.addEventListener(ENVELOPE_REPLY_EVENT, ((event: CustomEvent) => {
      log.debug('get reply message', event);
      this.emit(ENVELOPE_REPLY_EVENT, event.detail);
    }) as EventListener);

    window.addEventListener(NOTIFY_EVENT, ((event: CustomEvent) => {
      log.debug('get notify message', event);
      this.emit(NOTIFY_EVENT, event.detail);
    }) as EventListener);
  }

  send(message: { action: string; data: any; uuid: string }) {
    /**
     * this function is invoked by injected side only
     */
    const event = new CustomEvent(ENVELOPE_EVENT, {
      detail: {
        message,
        source: this.tunnelKey,
        isTronLink: true,
      },
    });
    window.dispatchEvent(event);
  }
}
