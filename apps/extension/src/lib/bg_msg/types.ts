export type MessageSourceType = 'popup' | 'tab';

export interface MessageMetaType {
  source: MessageSourceType; // port.name
  portID: string;
  sender: chrome.runtime.MessageSender;
}

export interface DuplexMessageMetaType extends MessageMetaType {
  resolve: (res: any) => void;
  reject: (res: any) => void;
}

export interface MessageType {
  noAck?: boolean;
  messageID?: string;
  action: string;
  payload: any;
}
