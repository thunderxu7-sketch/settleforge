export async function getActiveTabs() {
  const tabs = await chrome.tabs.query({ active: true });
  return tabs;
}

export interface TabInfoType {
  title: string;
  origin: string;
  id?: number;
  protocol?: string;
  url?: string;
  favIconUrl?: string;
  hostname?: string;
}

export async function getCurrentActiveTabInfo(): Promise<TabInfoType> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { id, title, url, favIconUrl } = activeTab;
  let origin: string | undefined = undefined;
  let protocol: string | undefined = undefined;
  let hostname: string | undefined = undefined;
  if (url) {
    const urlObj = new URL(url);
    origin = urlObj.origin;
    protocol = urlObj.protocol;
    hostname = urlObj.hostname;
  }

  if (!origin || origin === 'null') {
    return { origin: 'newtab', title: 'newtab' };
  }
  return { id, title: title!, origin, protocol, url, favIconUrl, hostname };
}
