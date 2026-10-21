class ChromeStorage {
  async setItem(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async getItem<T>(key: string): Promise<T> {
    const res = await chrome.storage.local.get(key);
    return res[key] as T;
  }

  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  async removeItems(keys: string[]): Promise<void> {
    await chrome.storage.local.remove(keys);
  }
}

export const chromeStorage = new ChromeStorage();
