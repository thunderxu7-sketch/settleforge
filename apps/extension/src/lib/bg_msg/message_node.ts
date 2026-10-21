import EventEmitter from 'events';
import log from 'loglevel';

import {
  AbstractMessage,
  DuplexMessage,
  REPLY_MESSAGE_ACTION_NAME,
  SimplexMessage,
  TimeoutError,
} from './common';

function ping(resolve: () => void) {
  chrome.runtime.sendMessage('ping', (response) => {
    if (chrome.runtime.lastError) {
      setTimeout(() => ping(resolve), 50);
    } else {
      resolve();
    }
  });
}

function pingPromise() {
  return new Promise<void>((resolve, reject) => {
    ping(resolve);
  });
}

function startPingJob() {
  log.debug('start ping job');
  setTimeout(async () => {
    try {
      await chrome.runtime.sendMessage('ping');
    } catch (e: any) {
      // ignore
    }
    startPingJob();
  }, 60000);
}

export class MessageNode extends EventEmitter {
  private readonly type: 'popup' | 'tab';
  private port: chrome.runtime.Port | undefined;
  private outgoing: Map<string, DuplexMessage>;

  constructor(type: 'popup' | 'tab') {
    super();
    this.type = type;
    this.outgoing = new Map();
  }

  async init(cleanExpire = true) {
    log.debug('init port');

    log.debug('**** start ping');
    await pingPromise();
    log.debug('**** end ping');
    this.initPort();
    if (cleanExpire) {
      this.cleanTimer();
    }
  }

  private initPort() {
    this.port = chrome.runtime.connect({ name: this.type });
    this.port.onMessage.addListener((message: any) => {
      this.handleMessage(message);
    });
    startPingJob();
  }

  private cleanTimer() {
    setTimeout(() => {
      for (const [key, msg] of this.outgoing.entries()) {
        if (Date.now() > msg.expireTime && !msg.isRetrying) {
          log.debug('msg expired, key:', key);
          msg.reject(new TimeoutError());
          this.outgoing.delete(key);
        }
      }

      this.cleanTimer();
    }, 1000);
  }

  private handleMessage(message: any) {
    log.debug('**** MessageNode handle message', message);
    const { messageID, action, payload } = message;

    // use __ prefix to avoid conflict
    if (action == REPLY_MESSAGE_ACTION_NAME) {
      this.handleReply(messageID, payload);
      return;
    }

    this.emit(action, payload);
  }

  private handleReply(messageID: string, payload: any) {
    log.debug('**** handleReply', payload);
    if (!this.outgoing.has(messageID)) {
      log.warn('MessageNode outgoing id not exist! ignore it', messageID);
      return;
    }

    const { error, res } = payload;

    if (error) {
      this.outgoing.get(messageID)?.reject(res);
    } else {
      this.outgoing.get(messageID)?.resolve(res);
    }

    this.outgoing.delete(messageID);
  }

  private postWithRetry = (message: AbstractMessage, tryTime = 1) => {
    log.debug('****', 'tryTime:', tryTime, message);
    try {
      this.port?.postMessage(message);
    } catch (e) {
      log.debug('**** retry connect, try time: ', tryTime, e);
      this.port = undefined;
      try {
        this.initPort();
      } catch (e) {
        log.error('**** reconnecting error');
      }
      if (tryTime <= 3) {
        message.isRetrying = true;
        this.postWithRetry(message, ++tryTime);
      } else {
        message.isRetrying = false;
      }
    }
  };

  async send(message: AbstractMessage): Promise<any> {
    if (message instanceof SimplexMessage) {
      // this.port.postMessage(message);
      this.postWithRetry(message);
      return;
    } else if (message instanceof DuplexMessage) {
      return new Promise((resolve, reject) => {
        message.setPromiseFunc(resolve, reject);
        this.outgoing.set(message.messageID, message);
        // this.port.postMessage(message);
        this.postWithRetry(message);
      });
    }
    throw TypeError('message need to inherit from AbstractMessage');
  }
}
