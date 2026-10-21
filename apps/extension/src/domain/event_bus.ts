import EventEmitter from 'events';

export const EVENT_DELETE_ADDRESS = 'EVENT_DELETE_ADDRESS';
export const EVENT_CHANGE_ADDRESS = 'EVENT_CHANGE_ADDRESS';
export const EVENT_DELETE_NODE = 'EVENT_DELETE_NODE';

export const eventBus = new EventEmitter();
