import { MessageNode } from '../lib/bg_msg';
import { ENVELOPE_EVENT, EventTunnelAdjuster } from '../lib/event_tunnel';
import { callTabRequestService } from '../service/tab/tab_request_service';
import { StorageMonitor } from '../lib/storage_monitor';
import { NOTIFY_EVENT_KEY } from '../lib/notify_event';

export class Postman {
  msgNode: MessageNode;
  eventTunnel: EventTunnelAdjuster;

  constructor() {
    this.msgNode = new MessageNode('tab');
    this.eventTunnel = new EventTunnelAdjuster('contentScript');
  }

  async startWork() {
    await this.msgNode.init(false);

    // injected send 'ENVELOPE', postman get it then send to background
    // then got response from background, then reply to injected
    this.eventTunnel.on(ENVELOPE_EVENT, async (message: any) => {
      try {
        const res = await callTabRequestService(this.msgNode, message);
        this.eventTunnel.reply(res);
      } catch (e) {
        //ignore
      }
    });

    // get notify event
    const origin = window.location.origin;
    const storageMonitor = new StorageMonitor([NOTIFY_EVENT_KEY]);
    storageMonitor.on(NOTIFY_EVENT_KEY, (data: any) => {
      // if event origin not equals, ignore this message
      if (data.origin && data.origin != origin) {
        return;
      }
      this.eventTunnel.notify(data);
    });
  }
}
