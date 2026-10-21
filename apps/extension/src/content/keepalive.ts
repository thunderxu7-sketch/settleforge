export function keepalive() {
  setTimeout(async () => {
    try {
      await chrome.runtime.sendMessage('ping');
    } catch (e: any) {
      // ignore
    }
    keepalive();
  }, 10000);
}
