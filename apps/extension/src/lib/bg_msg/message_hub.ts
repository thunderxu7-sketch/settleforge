import { v4 as uuidV4 } from 'uuid';
import EventEmitter from 'events';

import { AbstractMessage, DuplexMessage, DuplexRespMessage, SimplexMessage } from './common';
import type { MessageMetaType, MessageSourceType } from './types';
import log from "loglevel";

export class MessageHub extends EventEmitter {
  private readonly ports: Map<string, chrome.runtime.Port>;
  private readonly sourceActionNameMapping: Map<MessageSourceType, Set<string>>;

  constructor() {
    super();

    this.ports = new Map();
    this.sourceActionNameMapping = new Map();
  }

  startListening() {
    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.handleConnect(port);
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      sendResponse('pong');
    });
  }

  private handleConnect(port: chrome.runtime.Port) {
    const { name: portName, sender } = port;

    const { id: extensionID } = sender!;

    // reject other extension to connect
    if (extensionID != chrome.runtime.id) {
      port.disconnect();
      console.warn(`Dropped unsolicited connection from ${extensionID}`);
      return;
    }

    if (portName != 'popup' && portName != 'tab') {
      port.disconnect();
      console.warn(`Dropped unsolicited connection from ${portName}`);
      return;
    }

    const portID = uuidV4();
    this.ports.set(portID, port);

    port.onMessage.addListener((message: any) => {
      this.onPortMessage(message, {
        source: portName,
        sender: sender!,
        portID,
      });
    });

    port.onDisconnect.addListener(() => {
      this.ports.delete(portID);
      this.emit(`${portName}:disconnect`);
      log.debug('**** port disconnected: ', portName, portID, port);
    });

    this.emit(`${portName}:connect`);
    log.debug('**** port connected: ', portName, portID, port);
  }

  private onPortMessage(messageDict: any, messageMeta: MessageMetaType) {
    log.debug('**** onPortMessage!', messageDict);
    // const { noAck = false, messageID, action, payload } = message;
    const message = AbstractMessage.fromJSON(messageDict);

    const { action, payload } = message;

    // check source and action is invalid
    if (!this.checkSourceAction(messageMeta.source, action)) {
      console.error(`Dropping unauthorized request: ${messageMeta.source}, ${action}`, payload);
      return;
    }

    if (message instanceof SimplexMessage) {
      this.emit(action, payload, messageMeta);
      return;
    } else if (message instanceof DuplexMessage) {
      const resolve = async (res: any) => {
        await this.reply(messageMeta, message, {
          error: false,
          res,
        });
      };

      const reject = async (res: any) => {
        await this.reply(messageMeta, message, {
          error: true,
          res,
        });
      };

      this.emit(action, payload, {
        ...messageMeta,
        resolve,
        reject,
      });
    }
  }

  async send(messageMeta: MessageMetaType, message: SimplexMessage): Promise<any> {
    // now only support SimplexMessage for sending HUB -> NODE initiative, barely used
    log.debug('**** MessageHub send to: ', messageMeta.source, message);
    const port = this.ports.get(messageMeta.portID);
    if (!port) {
      console.warn('port is not exist!');
      return;
    }

    port.postMessage(message);
  }

  private async reply(
    messageMeta: MessageMetaType,
    sourceMessage: DuplexMessage,
    payload: any,
  ): Promise<void> {
    const respMessage = new DuplexRespMessage(sourceMessage.messageID, payload);
    log.debug('**** MessageHub reply to: ', messageMeta.source, respMessage);

    const port = this.ports.get(messageMeta.portID);
    if (!port) {
      console.warn('port is not exist!');
      return;
    }

    port.postMessage(respMessage);
  }

  broadcast(source: MessageSourceType, message: SimplexMessage): void {
    log.debug('**** MessageHub broadcast: ', message);
    this.ports.forEach((port) => {
      if (port.name != source) {
        return;
      }

      try {
        port.postMessage(message);
      } catch (e) {
        // port disconnected, ignore
      }
    });
  }

  registerSourceActionName(source: MessageSourceType, eventName: string): void {
    const eventNames = this.sourceActionNameMapping.get(source);
    if (eventNames) {
      eventNames.add(eventName);
    } else {
      this.sourceActionNameMapping.set(source, new Set([eventName]));
    }
  }

  private checkSourceAction(source: MessageSourceType, action: string) {
    const eventNames = this.sourceActionNameMapping.get(source);
    return eventNames && eventNames.has(action);
  }
}

export function getHostname(sender: chrome.runtime.MessageSender) {
  return new URL(sender.url!).hostname;
}
