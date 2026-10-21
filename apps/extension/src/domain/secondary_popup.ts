import _ from 'lodash';

class SecondaryPopup {
  window?: chrome.windows.Window;
  isOpening = false;

  static #instance: SecondaryPopup;

  public static getInstance(): SecondaryPopup {
    if (!SecondaryPopup.#instance) {
      SecondaryPopup.#instance = new SecondaryPopup();
    }

    return SecondaryPopup.#instance;
  }

  public async focusWindow() {
    // do focus
    if (this.window) {
      try {
        // @ts-ignore
        await chrome.windows.update(this.window.id, {
          focused: true,
        });
        return true;
      } catch (e) {
        this.window = undefined;
      }
    }
    return false;
  }

  public async open(url: string) {
    if (this.isOpening) {
      return;
    }

    if (await this.focusWindow()) {
      return;
    }

    this.isOpening = true;

    this.window = await chrome.windows.create({
      url,
      type: 'popup',
      width: 360,
      height: 625,
      left: 25,
      top: 25,
    });

    this.isOpening = false;

    if (this.window.state == 'fullscreen') {
      // @ts-ignore
      await chrome.windows.update(this.window.id, {
        width: 360,
        height: 625,
        left: 25,
        top: 25,
        focused: true,
      });
    }
  }

  public async close() {
    if (!this.window) {
      return;
    }

    try {
      await chrome.windows.remove(this.window.id!);
    } catch (err: any) {
      // ignore
    }
    this.window = undefined;
  }

  async isWindowOpened() {
    let isOpened = false;
    if (this.window) {
      const windows = await chrome.windows.getAll();
      isOpened = _.findIndex(windows, (ele) => ele.id == this.window!.id) > -1;
    }
    return isOpened;
  }

  async getOpenedUrl() {
    let url = '';
    if (this.window) {
      const windows = await chrome.windows.getAll();
      const window = _.find(windows, (ele) => ele.id == this.window!.id);
      const tabs = await chrome.tabs.query({ active: true });
      if (window?.id) {
        const tab = _.find(tabs, (ele) => ele.windowId == window.id);
        url = tab?.url || '';
      }
    }
    return url;
  }
}

export const secondaryPopup = SecondaryPopup.getInstance();
