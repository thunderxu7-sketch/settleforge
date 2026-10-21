import log from 'loglevel';
import { v4 as uuidV4 } from 'uuid';

import { ENVELOPE_REPLY_EVENT, EventTunnelClient } from '../lib/event_tunnel';

interface PromiseHandlers {
  resolve: (data: any) => void;
  reject: (data: any) => void;
}

export class RequestHandler {
  private eventTunnel: EventTunnelClient;
  private outgoing: Map<string, PromiseHandlers>;

  constructor(eventTunnel: EventTunnelClient) {
    this.eventTunnel = eventTunnel;
    this.outgoing = new Map();

    this.registerReplyHandler();
  }

  private registerReplyHandler() {
    this.eventTunnel.on(ENVELOPE_REPLY_EVENT, (res: any) => {
      log.debug('request handler got reply event', res);
      const { success, data, uuid } = res;
      if (success) {
        this.outgoing.get(uuid)?.resolve(data);
      } else {
        this.outgoing.get(uuid)?.reject(data);
      }

      this.outgoing.delete(uuid);
    });
  }

  send(action: string, data?: any) {
    const uuid = uuidV4();
    this.eventTunnel.send({ action, data, uuid });

    return new Promise((resolve, reject) => {
      this.outgoing.set(uuid, { resolve, reject });
    });
  }
}
