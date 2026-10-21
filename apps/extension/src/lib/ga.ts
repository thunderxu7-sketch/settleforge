declare global {
  interface Window {
    ga: (...args: any[]) => void;
  }
}

export function initGoogleAnalytics() {
  window.ga = window.ga || (() => undefined);
}
