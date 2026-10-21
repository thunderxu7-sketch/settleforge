import { v4 as uuidv4 } from 'uuid';

export const REPLY_MESSAGE_ACTION_NAME = '__REPLY_MESSAGE__';

export abstract class AbstractMessage {
  action: string;
  payload: any;

  needResp: boolean;
  isRetrying: boolean;

  protected constructor(action: string, payload: any) {
    this.action = action;
    this.payload = payload;
    this.needResp = false;
    this.isRetrying = false;
  }

  static fromJSON(jsonObj: any) {
    const { action, payload } = jsonObj;
    if (jsonObj.needResp) {
      const msg = new DuplexMessage(action, payload);
      msg.messageID = jsonObj.messageID;
      return msg;
    } else {
      return new SimplexMessage(action, payload);
    }
  }
}

export class SimplexMessage extends AbstractMessage {
  constructor(action: string, payload?: any) {
    super(action, payload);
    this.needResp = false;
  }
}

export class DuplexMessage extends AbstractMessage {
  messageID: string;
  expireTime: number;
  resolve!: (res: any) => void;
  reject!: (error: any) => void;

  constructor(action: string, payload?: any, timoutInSeconds = 8) {
    super(action, payload);
    this.needResp = true;
    this.messageID = uuidv4();
    this.expireTime = Date.now() + timoutInSeconds * 1000;
  }

  setPromiseFunc(resolve: (res: any) => void, reject: (error: any) => void) {
    this.resolve = resolve;
    this.reject = reject;
  }
}

export class DuplexRespMessage extends AbstractMessage {
  messageID: string;

  constructor(messageID: string, payload: any) {
    super(REPLY_MESSAGE_ACTION_NAME, payload);
    this.needResp = false;
    this.messageID = messageID;
  }
}

export class TimeoutError extends Error {
  constructor(message = 'expired') {
    super(message);
  }
}
