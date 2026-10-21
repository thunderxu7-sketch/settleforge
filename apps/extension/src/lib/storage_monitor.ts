import EventEmitter from 'events';

export class StorageMonitor extends EventEmitter {
  keys: string[];

  constructor(keys: string[]) {
    super();
    this.keys = keys;
    this.registerListener();
  }

  private registerListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      // only monitor local changed
      if (namespace != 'local') {
        return;
      }

      for (const [key, { newValue }] of Object.entries(changes)) {
        if (this.keys.includes(key)) {
          this.emit(key, newValue);
        }
      }
    });
  }
}
